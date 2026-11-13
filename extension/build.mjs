import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildExtension() {
  console.log("⚡ Building Godcandle Chrome Extension...");
  const outDir = resolve(__dirname, "dist");
  await fs.ensureDir(outDir);

  // 1. Bundle content script as a single, standalone IIFE bundle (NO ES chunk imports allowed in content scripts!)
  console.log("📦 Bundling content.js as standalone IIFE bundle...");
  await esbuild.build({
    entryPoints: [resolve(__dirname, "src/content.tsx")],
    bundle: true,
    minify: true,
    format: "iife",
    outfile: resolve(outDir, "content.js"),
    define: {
      "process.env.NODE_ENV": '"production"'
    },
    sourcemap: false
  });

  // 2. Bundle background service worker as standalone bundle
  console.log("📦 Bundling background.js as service worker...");
  await esbuild.build({
    entryPoints: [resolve(__dirname, "src/background/serviceWorker.ts")],
    bundle: true,
    minify: true,
    format: "esm",
    outfile: resolve(outDir, "background.js"),
    define: {
      "process.env.NODE_ENV": '"production"'
    },
    sourcemap: false
  });

  // 3. Bundle options page script as standalone bundle
  console.log("📦 Bundling options.js...");
  await esbuild.build({
    entryPoints: [resolve(__dirname, "src/options/OptionsPage.tsx")],
    bundle: true,
    minify: true,
    format: "esm",
    outfile: resolve(outDir, "options.js"),
    define: {
      "process.env.NODE_ENV": '"production"'
    },
    sourcemap: false
  });

  // 4. Copy static assets
  console.log("📋 Copying manifest.json, options.html, and icons...");
  await fs.copy(resolve(__dirname, "manifest.json"), resolve(outDir, "manifest.json"));
  await fs.copy(resolve(__dirname, "options.html"), resolve(outDir, "options.html"));
  await fs.copy(resolve(__dirname, "public/icons"), resolve(outDir, "icons"));

  console.log("✅ Godcandle Extension built successfully in dist/!");
}

buildExtension().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
