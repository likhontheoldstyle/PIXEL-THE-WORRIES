#!/usr/bin/env node
/**
 * scripts/generate-tools-manifest.js
 * ----------------------------------------------------------------
 * Scans src/tools/* for a config.json in each tool folder and:
 *   1. Builds public/tools-manifest.json  (consumed by the Tools
 *      menu + Tools page on the client, and by the /api/tools
 *      route in local dev)
 *   2. Copies each tool's static files (html/css/js) into
 *      public/tools/<slug>/ so they can be served as plain static
 *      assets on Netlify (no server required for the UI itself).
 *
 * HOW TO ADD A NEW TOOL (no code changes required elsewhere):
 *   1. Create src/tools/<your-tool-slug>/
 *   2. Add config.json, index.html, style.css, script.js
 *      (see src/tools/imgbb-upload for the reference shape)
 *   3. Run `npm run build` (or it runs automatically on Netlify
 *      deploy via the build command). The tool now appears in the
 *      Tools menu automatically.
 * ----------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TOOLS_SRC = path.join(ROOT, "src", "tools");
const STYLES_SRC = path.join(ROOT, "src", "styles");
const ASSETS_SRC = path.join(ROOT, "src", "assets");
const PUBLIC_DIR = path.join(ROOT, "public");
const TOOLS_OUT = path.join(PUBLIC_DIR, "tools");
const MANIFEST_OUT = path.join(PUBLIC_DIR, "tools-manifest.json");

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    // Never leak server-only files (api.js, .env, config with secrets) to the public bundle.
    if (["api.js", "server.js", ".env"].includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncStaticFolder(src, dest, label) {
  if (!fs.existsSync(src)) return;
  fs.rmSync(dest, { recursive: true, force: true });
  copyDirSync(src, dest);
  console.log(`[build] Synced ${label} → ${path.relative(ROOT, dest)}`);
}

function generate() {
  // Netlify serves /public statically with no server involved, so global
  // styles and assets (referenced as /styles/* and /assets/* in the HTML)
  // must physically live inside /public too. This keeps src/ as the single
  // place to edit them while still working on Netlify.
  syncStaticFolder(STYLES_SRC, path.join(PUBLIC_DIR, "styles"), "src/styles");
  syncStaticFolder(ASSETS_SRC, path.join(PUBLIC_DIR, "assets"), "src/assets");

  if (!fs.existsSync(TOOLS_SRC)) {
    console.warn("[tools-manifest] src/tools does not exist, skipping.");
    return;
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(TOOLS_OUT, { recursive: true });

  const slugs = fs
    .readdirSync(TOOLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const manifest = [];

  for (const slug of slugs) {
    const toolDir = path.join(TOOLS_SRC, slug);
    const configPath = path.join(toolDir, "config.json");

    if (!fs.existsSync(configPath)) {
      console.warn(`[tools-manifest] Skipping "${slug}" — no config.json found.`);
      continue;
    }

    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (err) {
      console.error(`[tools-manifest] Invalid config.json in "${slug}":`, err.message);
      continue;
    }

    copyDirSync(toolDir, path.join(TOOLS_OUT, slug));

    manifest.push({
      slug,
      name: config.name || slug,
      description: config.description || "",
      icon: config.icon || "wrench",
      entry: `/tools/${slug}/index.html`,
      enabled: config.enabled !== false,
    });
  }

  manifest.sort((a, b) => (a.order || 0) - (b.order || 0));

  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
  console.log(`[tools-manifest] Wrote ${manifest.length} tool(s) to ${MANIFEST_OUT}`);
}

generate();
