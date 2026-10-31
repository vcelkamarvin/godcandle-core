/**
 * Pure TypeScript lightweight MessagePack encoder compliant with Hyperliquid's
 * deterministic serialization requirements.
 */

export function encodeMsgpack(value: unknown): Uint8Array {
  const chunks: Uint8Array[] = [];

  function encodeValue(v: unknown): void {
    if (v === null || v === undefined) {
      chunks.push(new Uint8Array([0xc0]));
      return;
    }

    if (typeof v === "boolean") {
      chunks.push(new Uint8Array([v ? 0xc3 : 0xc2]));
      return;
    }

    if (typeof v === "number") {
      if (Number.isInteger(v)) {
        if (v >= 0) {
          if (v <= 0x7f) {
            chunks.push(new Uint8Array([v]));
          } else if (v <= 0xff) {
            chunks.push(new Uint8Array([0xcc, v]));
          } else if (v <= 0xffff) {
            const buf = new Uint8Array(3);
            buf[0] = 0xcd;
            new DataView(buf.buffer).setUint16(1, v, false);
            chunks.push(buf);
          } else if (v <= 0xffffffff) {
            const buf = new Uint8Array(5);
            buf[0] = 0xce;
            new DataView(buf.buffer).setUint32(1, v, false);
            chunks.push(buf);
          } else {
            const buf = new Uint8Array(9);
            buf[0] = 0xcf;
            new DataView(buf.buffer).setBigUint64(1, BigInt(v), false);
            chunks.push(buf);
          }
        } else {
          if (v >= -32) {
            chunks.push(new Uint8Array([v + 256]));
          } else if (v >= -128) {
            chunks.push(new Uint8Array([0xd0, v + 256]));
          } else if (v >= -32768) {
            const buf = new Uint8Array(3);
            buf[0] = 0xd1;
            new DataView(buf.buffer).setInt16(1, v, false);
            chunks.push(buf);
          } else if (v >= -2147483648) {
            const buf = new Uint8Array(5);
            buf[0] = 0xd2;
            new DataView(buf.buffer).setInt32(1, v, false);
            chunks.push(buf);
          } else {
            const buf = new Uint8Array(9);
            buf[0] = 0xd3;
            new DataView(buf.buffer).setBigInt64(1, BigInt(v), false);
            chunks.push(buf);
          }
        }
      } else {
        // Float64
        const buf = new Uint8Array(9);
        buf[0] = 0xcb;
        new DataView(buf.buffer).setFloat64(1, v, false);
        chunks.push(buf);
      }
      return;
    }

    if (typeof v === "string") {
      const encoder = new TextEncoder();
      const strBytes = encoder.encode(v);
      const len = strBytes.length;

      if (len <= 31) {
        chunks.push(new Uint8Array([0xa0 | len]));
      } else if (len <= 0xff) {
        chunks.push(new Uint8Array([0xd9, len]));
      } else if (len <= 0xffff) {
        const buf = new Uint8Array(3);
        buf[0] = 0xda;
        new DataView(buf.buffer).setUint16(1, len, false);
        chunks.push(buf);
      } else {
        const buf = new Uint8Array(5);
        buf[0] = 0xdb;
        new DataView(buf.buffer).setUint32(1, len, false);
        chunks.push(buf);
      }
      chunks.push(strBytes);
      return;
    }

    if (Array.isArray(v)) {
      const len = v.length;
      if (len <= 15) {
        chunks.push(new Uint8Array([0x90 | len]));
      } else if (len <= 0xffff) {
        const buf = new Uint8Array(3);
        buf[0] = 0xdc;
        new DataView(buf.buffer).setUint16(1, len, false);
        chunks.push(buf);
      } else {
        const buf = new Uint8Array(5);
        buf[0] = 0xdd;
        new DataView(buf.buffer).setUint32(1, len, false);
        chunks.push(buf);
      }
      for (const item of v) {
        encodeValue(item);
      }
      return;
    }

    if (typeof v === "object") {
      const keys = Object.keys(v as object);
      const len = keys.length;
      if (len <= 15) {
        chunks.push(new Uint8Array([0x80 | len]));
      } else if (len <= 0xffff) {
        const buf = new Uint8Array(3);
        buf[0] = 0xde;
        new DataView(buf.buffer).setUint16(1, len, false);
        chunks.push(buf);
      } else {
        const buf = new Uint8Array(5);
        buf[0] = 0xdf;
        new DataView(buf.buffer).setUint32(1, len, false);
        chunks.push(buf);
      }
      for (const k of keys) {
        encodeValue(k);
        encodeValue((v as Record<string, unknown>)[k]);
      }
      return;
    }

    throw new Error(`Unsupported msgpack type: ${typeof v}`);
  }

  encodeValue(value);

  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}
