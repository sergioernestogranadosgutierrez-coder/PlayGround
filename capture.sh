#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p pwd
: "${CAPTURE_URL:?Set CAPTURE_URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p test -n "$CAPTURE_URL"
/usr/bin/time -p node -e '
const { readFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const { createRequire } = require("node:module");
const runtime = join(process.env.HOME, ".local/share/omgithub-playwright");
const req = createRequire(join("/tmp", "noop.js"));
const pwPath = join(runtime, "node_modules");
process.env.NODE_PATH = pwPath + (process.env.NODE_PATH ? ":" + process.env.NODE_PATH : "");
const { chromium } = require(join(pwPath, "playwright"));
(async () => {
  const url = process.env.CAPTURE_URL, out = process.env.CAPTURE_DIR;
  if (!url || !out) { console.error("Set CAPTURE_URL and CAPTURE_DIR."); process.exit(1); }
  mkdirSync(out, { recursive: true });
  const cfg = JSON.parse(readFileSync(join(runtime, "linux.json"), "utf8"));
  try { process.env.DISPLAY ||= ":" + readFileSync(join(runtime, "display"), "utf8").trim(); } catch {}
  const transient = (e) => { e.exitCode = 75; throw e; };
  let browser;
  try {
    browser = await chromium.launch({ ...cfg.browser.launchOptions, timeout: 30000 }).catch(transient);
    for (const [name, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } }).catch(transient);
      page.setDefaultTimeout(30000);
      page.on("pageerror", (e) => console.error(e.message));
      let resp;
      try { resp = await page.goto(url, { waitUntil: "load", timeout: 45000 }); }
      catch (e) { transient(e); }
      if (!resp || !resp.ok()) {
        const st = resp ? resp.status() : 0;
        const isTransient = !resp || [408, 429, 500, 502, 503, 504].includes(st);
        const err = new Error("HTTP " + st + " loading preview");
        err.exitCode = isTransient ? 75 : 1;
        throw err;
      }
      try {
        await page.locator("body").waitFor({ state: "visible", timeout: 30000 });
        await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
      } catch (e) {
        if (e.name === "TimeoutError") transient(e);
        throw e;
      }
      const shot = join(out, "final-" + name + ".png");
      try { await page.screenshot({ path: shot, timeout: 30000 }); }
      catch (e) {
        if (e.name === "TimeoutError" || !browser.isConnected()) transient(e);
        throw e;
      }
      console.log("captured " + shot);
      await page.close();
    }
  } catch (e) {
    console.error(e && e.stack || e);
    process.exit(e.exitCode || 1);
  } finally {
    try { await browser?.close(); } catch (e) { console.error(e); process.exitCode ||= 75; }
  }
})();
'
/usr/bin/time -p test -f "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -f "$CAPTURE_DIR/final-mobile.png"
/usr/bin/time -p ls -la "$CAPTURE_DIR"
