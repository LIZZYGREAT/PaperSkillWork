import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewPrototypeChecks } from "./review-prototypes.mjs";
import { lifecycleBrowserChecks } from "./lifecycle-browser.mjs";

// Development checks use the repository's single pinned browser toolchain.
// None of this is imported by the tutorial runtime.
const require = createRequire(new URL("../../../../../reusable-kit/demo/package.json", import.meta.url));
const { chromium } = require("playwright");
const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = "http://127.0.0.1:4196/der-review/";
const executablePath = process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const output = process.env.DER_REVIEW_DIR;
// Serve the exact production dist in this process; no cross-sandbox child service.
const dist = resolve(source, "dist");
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, base).pathname);
    if (!pathname.startsWith("/der-review/")) { res.writeHead(404); res.end(); return; }
    const file = resolve(dist, pathname.slice("/der-review/".length) || "index.html");
    if (!file.startsWith(dist + sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.setHeader("Content-Type", file.endsWith(".js") ? "application/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "text/html");
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
let browser;
let assertions = 0;
const check = (condition, message) => { assertions += 1; assert.ok(condition, message); };

async function ready() {
  await new Promise((done, reject) => { server.once("error", reject); server.listen(4196, "127.0.0.1", done); });
}

try {
  await ready();
  browser = await chromium.launch({ headless: true, executablePath });
  console.log(`Browser ${browser.version()}, Node ${process.version}`);
  if (output) await mkdir(output, { recursive: true });
  const viewports = [{width:1440,height:900,deviceScaleFactor:1},{width:1920,height:1080,deviceScaleFactor:1},
    // Reported short-window/zoom regression: CSS viewport equivalent to ~1912x872 at 125%.
    {width:1530,height:698,deviceScaleFactor:1.25}];
  for (const {width,height,deviceScaleFactor} of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on("response", (response) => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
    const shot = async (name, selector) => {
      if (!output) return;
      if (selector) await page.locator(selector).screenshot({ path: resolve(output, `${name}-${width}.png`), animations: "disabled" });
      else await page.screenshot({ path: resolve(output, `${name}-${width}.png`), animations: "disabled" });
    };
    if(deviceScaleFactor!==1){
      await page.clock.install();
      await lifecycleBrowserChecks({page,base,check,shot});
      check(errors.length===0,"No browser errors at the reported short-window/zoom equivalent");
      console.log(`${width}x${height}, DPR ${deviceScaleFactor}: lifecycle size and motion regression PASS`);
      await context.close();continue;
    }
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    check(page.url() === base, "Production preview must stay below the deploy subpath");
    check(await page.locator(".lesson-section").count() === 3, "Only three real reading units");
    check(await page.locator("[data-core-items]").count() === 4, "Real components cover I01–I05");
    for (const selector of ["#kl-definition math", "#kl-decomposition math", "#squared-definition math"]) {
      check(await page.locator(selector).first().isVisible(), `${selector} must be in the mainline, outside Reference`);
      check(await page.locator(selector).first().evaluate((el) => !el.closest("dialog,details")), `${selector} cannot be hidden in reference`);
      check(await page.locator(selector).first().evaluate((el) => el.getBoundingClientRect().width > 150), "Math must be typeset as a real expression");
    }
    await shot("opening");
    await shot("label-contrast", ".label-question");
    for (const [id, expected] of [["near", .09151622184943578], ["equal", 0], ["reversed", .8317766166719343]]) {
      const button = page.locator(`[data-review-q='${id}']`);
      await button.focus(); await button.press("Enter");
      check(await button.getAttribute("aria-pressed") === "true", "Keyboard changes q selection");
      await page.locator("[data-formula-select='3']").click();
      const value = Number(await page.locator("[data-review-kl]").getAttribute("data-review-kl"));
      check(Math.abs(value - expected) < 1e-12, "Displayed state comes from exact KL calculation");
      const meters = await page.locator(".kl-workspace meter").evaluateAll((nodes) => nodes.map((node) => node.value));
      check(meters[0] === .8 && meters[2] === .2, "Changing q never changes p");
      check(Math.abs(meters[1] + meters[3] - 1) < 1e-12, "Current q remains normalized");
      await shot(`probability-${id}`, "#review-kl .kl-workspace");
    }
    await shot("kl-mainline", "#review-kl .review-derivation");
    for (const [id, expected] of [["swapped", 2], ["shifted", 3]]) {
      const button = page.locator(`[data-review-a='${id}']`); await button.focus(); await button.press("Space");
      await page.locator("[data-logit-step='3']").click();
      check(Number(await page.locator("[data-review-squared]").getAttribute("data-review-squared")) === expected, "Squared distance follows the selected logits");
      check(await page.locator(".history-stem").evaluateAll((nodes) => nodes.map((el) => el.getAttribute("y2")).join(",")) === "110,162,214", "Old logits stay at their fixed coordinates");
      if (id === "shifted") check(Number(await page.locator("[data-review-probability-kl]").getAttribute("data-review-probability-kl")) === 0, "Common shift leaves probabilities unchanged");
      await shot(`logits-${id}`, ".score-workspace");
    }
    await shot("squared-mainline", ".logit-formula-result");
    await shot("shift-reason", "#review-logits .review-derivation");
    for (const index of [0, 1, 2, 3, 2, 1]) {
      await page.locator(`[data-freeze-step='${index}']`).click();
      check(await page.locator("[data-freeze-stage]").getAttribute("data-freeze-stage") === String(index), "Snapshot controls update the same phase");
      check(await page.locator("[data-history-z]").count() === (index > 0 ? 1 : 0), "History only exists after the copy action");
      if (index > 0) check(await page.locator("[data-history-z]").getAttribute("data-history-z") === "2,1,0", "Copied target stays fixed");
      if (index >= 2) check((await page.locator("[data-current-parameter]").innerText()) === "θₜ₊₁", "Only the current parameter version advances");
      await shot(`snapshot-${index}`, ".freeze-workspace");
    }
    const term = page.locator(".review-scene .rk-term-ref").first();
    await term.hover(); check(await page.locator(".rk-term-popover").isVisible(), "Contextual short definition is available");
    const referenceButton = page.locator(".site-header .text-button");
    await referenceButton.click(); check(await page.locator("dialog").isVisible(), "Reference opens as a modal");
    await shot("reference", "dialog");
    await page.keyboard.press("Tab");
    check(await page.evaluate(() => Boolean(document.activeElement?.closest("dialog"))), "Modal keyboard focus stays inside Reference");
    await page.locator("dialog nav").getByRole("button", { name: "logits", exact: true }).click();
    check(await page.locator("dialog article").innerText().then((value) => value.includes("不是概率") && value.includes("同一个类别坐标")), "Logits detail is about scores, not a generic distance article");
    await page.locator("dialog .source-note").scrollIntoViewIfNeeded();
    check(await page.locator("dialog .source-note a").isVisible(), "Long reference content and source remain reachable by scrolling");
    await shot("reference-logits", "dialog");
    await page.keyboard.press("Escape"); check(!await page.locator("dialog").isVisible(), "Escape closes Reference");
    check(await referenceButton.evaluate((el) => el === document.activeElement), "Closing restores focus");
    await referenceButton.click();
    check(await page.locator("dialog nav").getByRole("button", { name: "KL 散度", exact: true }).getAttribute("aria-pressed") === "true", "Reopening restores the requested term");
    await page.getByRole("button", { name: "关闭参考资料", exact: true }).click();
    check(!await page.locator("dialog").isVisible(), "The visible close control closes the modal");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("[data-review-q='equal']").click();
    await page.locator("[data-review-a='shifted']").click();
    check(await page.locator("[data-review-kl]").count() === 0, "Changing q remains available with reduced motion");
    check(await page.locator(".aligned-logits .current-stem").first().evaluate((el) => getComputedStyle(el).transitionDuration) === "0s", "Reduced motion disables decorative transitions");
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No page-wide horizontal overflow");
    const overflows = await page.locator("[data-vqa-check-clipping]").evaluateAll((nodes) => nodes.filter((el) => el.scrollWidth > el.clientWidth + 2).map((el) => el.id));
    check(overflows.length === 0, `Mainline formulas fit: ${overflows}`);
    await reviewPrototypeChecks({ page, base, check, shot });
    check(errors.length === 0, `No browser or subpath resource errors: ${errors.join("; ")}`);
    console.log(`${width}x${height}: q/a states, snapshot, math visibility, keyboard, Reference, reduced motion, subpath assets PASS`);
    await context.close();
  }
  console.log(`BROWSER_ASSERTIONS_PASS: ${assertions}; evidence=${output ?? "not retained"}`);
} finally {
  await browser?.close();
  server.close();
}
