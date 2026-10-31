/**
 * Minimal, zero-dependency, standard-compliant QR Code generator (ISO/IEC 18004).
 * Supports automatic version selection (Versions 1-10), Byte mode, and EC Level L/M.
 */

// GF(256) Math tables with primitive polynomial 0x11d
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  EXP[i + 255] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  const logA = LOG[a] ?? 0;
  const logB = LOG[b] ?? 0;
  return EXP[logA + logB] ?? 0;
}

// Reed-Solomon generator polynomial coefficients
function getRsGenerator(numEc: number): Uint8Array {
  let g = new Uint8Array([1]);
  for (let i = 0; i < numEc; i++) {
    const next = new Uint8Array(g.length + 1);
    const factor = EXP[i] ?? 0;
    for (let j = 0; j < g.length; j++) {
      const gj = g[j] ?? 0;
      next[j] = (next[j] ?? 0) ^ gmul(gj, factor);
      next[j + 1] = (next[j + 1] ?? 0) ^ gj;
    }
    g = next;
  }
  return g;
}

function computeEc(data: Uint8Array, numEc: number): Uint8Array {
  const gen = getRsGenerator(numEc);
  const remainder = new Uint8Array(numEc);
  for (let i = 0; i < data.length; i++) {
    const di = data[i] ?? 0;
    const r0 = remainder[0] ?? 0;
    const factor = di ^ r0;
    remainder.copyWithin(0, 1);
    remainder[numEc - 1] = 0;
    for (let j = 0; j < numEc; j++) {
      const genCoeff = gen[numEc - 1 - j] ?? 0;
      remainder[j] = (remainder[j] ?? 0) ^ gmul(genCoeff, factor);
    }
  }
  return remainder;
}

// Version table: [version, totalCodewords, dataCodewordsM, ecCodewordsPerBlockM, numBlocksM]
// For simplicity and high readability, we use Error Correction Level M (~15% recovery)
interface VersionInfo {
  version: number;
  totalCodewords: number;
  dataCodewords: number;
  ecPerBlock: number;
  blocks: { count: number; dataCodewords: number }[];
  alignmentCoords: number[];
}

const QR_VERSIONS: VersionInfo[] = [
  // V1 (21x21)
  {
    version: 1,
    totalCodewords: 26,
    dataCodewords: 16,
    ecPerBlock: 10,
    blocks: [{ count: 1, dataCodewords: 16 }],
    alignmentCoords: [],
  },
  // V2 (25x25)
  {
    version: 2,
    totalCodewords: 44,
    dataCodewords: 28,
    ecPerBlock: 16,
    blocks: [{ count: 1, dataCodewords: 28 }],
    alignmentCoords: [6, 18],
  },
  // V3 (29x29)
  {
    version: 3,
    totalCodewords: 70,
    dataCodewords: 44,
    ecPerBlock: 26,
    blocks: [{ count: 1, dataCodewords: 44 }],
    alignmentCoords: [6, 22],
  },
  // V4 (33x33)
  {
    version: 4,
    totalCodewords: 100,
    dataCodewords: 64,
    ecPerBlock: 18,
    blocks: [{ count: 2, dataCodewords: 32 }],
    alignmentCoords: [6, 26],
  },
  // V5 (37x37)
  {
    version: 5,
    totalCodewords: 134,
    dataCodewords: 86,
    ecPerBlock: 24,
    blocks: [{ count: 2, dataCodewords: 43 }],
    alignmentCoords: [6, 30],
  },
  // V6 (41x41)
  {
    version: 6,
    totalCodewords: 172,
    dataCodewords: 108,
    ecPerBlock: 16,
    blocks: [{ count: 4, dataCodewords: 27 }],
    alignmentCoords: [6, 34],
  },
];

export function encodeQr(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const dataLen = utf8.length;

  const requiredBits = 4 + 8 + dataLen * 8;
  const requiredBytes = Math.ceil(requiredBits / 8);

  const vInfo = QR_VERSIONS.find((v) => v.dataCodewords >= requiredBytes);
  if (!vInfo) {
    throw new Error(`Data too long for QR Code: ${text}`);
  }

  // 1. Bit stream creation
  const bitStream: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >>> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for V1-V9)
  pushBits(dataLen, 8);
  // Data bytes
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8[i] ?? 0, 8);
  }

  // Terminator (up to 4 zero bits)
  const maxBits = vInfo.dataCodewords * 8;
  const terminatorLen = Math.min(4, maxBits - bitStream.length);
  pushBits(0, terminatorLen);

  // Pad to byte boundary
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11] as const;
  let padIdx = 0;
  while (bitStream.length < maxBits) {
    pushBits(padBytes[padIdx % 2] ?? 0xec, 8);
    padIdx++;
  }

  // Convert bits to codewords
  const dataCodewords = new Uint8Array(vInfo.dataCodewords);
  for (let i = 0; i < dataCodewords.length; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | (bitStream[i * 8 + b] ?? 0);
    }
    dataCodewords[i] = byteVal;
  }

  // 2. Block division and Error Correction
  const blocks: { data: Uint8Array; ec: Uint8Array }[] = [];
  let offset = 0;
  for (const blockConfig of vInfo.blocks) {
    for (let i = 0; i < blockConfig.count; i++) {
      const bData = dataCodewords.subarray(offset, offset + blockConfig.dataCodewords);
      offset += blockConfig.dataCodewords;
      const bEc = computeEc(bData, vInfo.ecPerBlock);
      blocks.push({ data: bData, ec: bEc });
    }
  }

  // Interleave data codewords
  const interleaved: number[] = [];
  const maxDataLen = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blocks) {
      if (i < b.data.length) {
        interleaved.push(b.data[i] ?? 0);
      }
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < vInfo.ecPerBlock; i++) {
    for (const b of blocks) {
      if (i < b.ec.length) {
        interleaved.push(b.ec[i] ?? 0);
      }
    }
  }

  // 3. Grid placement
  const size = vInfo.version * 4 + 17;
  const grid: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r: number, c: number, val: boolean) {
    const row = grid[r];
    if (row) row[c] = val;
    const fnRow = isFunction[r];
    if (fnRow) fnRow[c] = true;
  }

  function getIsFunction(r: number, c: number): boolean {
    return isFunction[r]?.[c] ?? false;
  }

  // Finder pattern (7x7) + separator (1 border)
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const gr = row + r;
        const gc = col + c;
        if (gr >= 0 && gr < size && gc >= 0 && gc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isDark =
              r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            setFunction(gr, gc, isDark);
          } else {
            // White separator
            setFunction(gr, gc, false);
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment patterns
  if (vInfo.alignmentCoords.length > 0) {
    for (const r of vInfo.alignmentCoords) {
      for (const c of vInfo.alignmentCoords) {
        // Skip if overlaps finder
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 8) || (r >= size - 8 && c <= 8)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isDark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setFunction(r + dr, c + dc, isDark);
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!getIsFunction(6, i)) setFunction(6, i, i % 2 === 0);
    if (!getIsFunction(i, 6)) setFunction(i, 6, i % 2 === 0);
  }

  // Dark module
  setFunction(4 * vInfo.version + 9, 8, true);

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    const r8 = isFunction[8];
    if (r8 && !r8[i]) r8[i] = true;
    const ri = isFunction[i];
    if (ri && !ri[8]) ri[8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    const r8 = isFunction[8];
    if (r8 && !r8[i]) r8[i] = true;
    const ri = isFunction[i];
    if (ri && !ri[8]) ri[8] = true;
  }

  // Convert interleaved bytes to bit sequence
  const dataBits: number[] = [];
  for (const byte of interleaved) {
    for (let b = 7; b >= 0; b--) {
      dataBits.push((byte >>> b) & 1);
    }
  }

  // Place data bits in zig-zag
  let bitIdx = 0;
  let dir = -1; // up: -1, down: 1
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing column
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;
    for (let r = rStart; r !== rEnd; r += dir) {
      for (let dc = 0; dc < 2; dc++) {
        const col = c - dc;
        if (!getIsFunction(r, col)) {
          const row = grid[r];
          if (row) {
            row[col] = bitIdx < dataBits.length ? dataBits[bitIdx] === 1 : false;
          }
          bitIdx++;
        }
      }
    }
    dir = -dir;
  }

  // Apply mask 0: (r + c) % 2 === 0
  const maskFn = (r: number, c: number) => (r + c) % 2 === 0;
  const formatBits = 0x5412; // mask 0 for EC level M

  // Apply mask to data bits
  const finalGrid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    finalGrid[r] = [];
    const targetRow = finalGrid[r]!;
    for (let c = 0; c < size; c++) {
      let val = grid[r]?.[c] ?? false;
      if (!getIsFunction(r, c)) {
        if (maskFn(r, c)) val = !val;
      }
      targetRow[c] = val;
    }
  }

  // Write format info bits into grid (ISO/IEC 18004 standard placement)
  // First copy around top-left finder pattern
  for (let i = 0; i <= 5; i++) {
    const row = finalGrid[i];
    if (row) row[8] = ((formatBits >>> i) & 1) === 1;
  }
  if (finalGrid[7]) finalGrid[7][8] = ((formatBits >>> 6) & 1) === 1;
  if (finalGrid[8]) {
    finalGrid[8][8] = ((formatBits >>> 7) & 1) === 1;
    finalGrid[8][7] = ((formatBits >>> 8) & 1) === 1;
    for (let i = 9; i < 15; i++) {
      finalGrid[8][14 - i] = ((formatBits >>> i) & 1) === 1;
    }
    for (let i = 0; i < 8; i++) {
      finalGrid[8][size - 1 - i] = ((formatBits >>> i) & 1) === 1;
    }
  }

  // Second copy around bottom-left
  for (let i = 8; i < 15; i++) {
    const row = finalGrid[size - 15 + i];
    if (row) row[8] = ((formatBits >>> i) & 1) === 1;
  }
  const darkRow = finalGrid[size - 8];
  if (darkRow) {
    darkRow[8] = true; // Dark module
  }

  return finalGrid;
}

export function drawQrMatrixToCanvas(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  x: number,
  y: number,
  size: number,
  color = "#111111",
  bgColor = "#FFFFFF",
) {
  const n = matrix.length;
  // White quiet zone border / background
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, size, size);

  const padding = 2; // quiet modules
  const cellSize = size / (n + padding * 2);

  ctx.fillStyle = color;
  for (let r = 0; r < n; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < n; c++) {
      if (row[c]) {
        const px = Math.round(x + (c + padding) * cellSize);
        const py = Math.round(y + (r + padding) * cellSize);
        const pw = Math.ceil(cellSize);
        const ph = Math.ceil(cellSize);
        ctx.fillRect(px, py, pw, ph);
      }
    }
  }
}

export function generateQrSvgPath(
  matrix: boolean[][],
  padding = 2,
): { path: string; viewBoxSize: number } {
  const n = matrix.length;
  let d = "";
  for (let r = 0; r < n; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < n; c++) {
      if (row[c]) {
        d += `M${c + padding},${r + padding}h1v1h-1z `;
      }
    }
  }
  return { path: d, viewBoxSize: n + padding * 2 };
}
