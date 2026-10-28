import assert from "node:assert/strict";

/** Browser checks for the v2 lifecycle stage. The five keyframes group as 1 | 2 | 3–4 | 5–6 | 7–8. */
export async function lifecycleBrowserChecks({ page, base, check, shot }) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.pauseAt(await page.evaluate(() => Date.now()));
  await page.goto(`${base}?review=1#review-lifecycle`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const scene = page.locator("[data-scene=lifecycle]");
  const canvasBox = await scene.locator("svg").boundingBox(), readingBox = await page.locator(".reading-layout").boundingBox();
  check(canvasBox.width >= readingBox.width * 0.95, "Scene uses the reading width even in short windows");
  const labelPx = await scene.locator("svg text").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) * Math.hypot(el.getScreenCTM().a, el.getScreenCTM().b));
  check(labelPx >= 12, "Diagram labels retain a readable screen size instead of shrinking with viewport height");
  const tick = ms => page.clock.runFor(ms);
  const state = () => scene.evaluate(el => ({ clip: Number(el.dataset.clip), p: Number(el.dataset.progress), status: el.dataset.status }));
  const at = async (clip, p) => {
    for (let n = 0; n < 1600; n++) {
      const s = await state();
      if (s.clip === clip && s.p >= p) return;
      await tick(50);
    }
    throw Error(`Lifecycle did not reach ${clip}:${p}`);
  };
  const geometry = async () => {
    const result = await scene.locator("svg").evaluate(svg => {
      const root = svg.getBoundingClientRect();
      const alpha = el => { let a = 1; for (let n = el; n && n !== svg.parentElement; n = n.parentElement) a *= Number(getComputedStyle(n).opacity); return a; };
      const labels = [...svg.querySelectorAll("text")].filter(el => alpha(el) > 0.12).map(el => {
        const b = el.getBoundingClientRect();
        return { text: el.textContent.trim().slice(0, 18), x: b.x - root.x, y: b.y - root.y, w: b.width, h: b.height };
      });
      const outside = labels.filter(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > root.width + 0.5 || b.y + b.h > root.height + 0.5);
      const pairs = [];
      for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i], b = labels[j];
        if (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 2 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 2) pairs.push([a.text, b.text]);
      }
      const crossed = [];
      for (const path of svg.querySelectorAll(".lc-gradient,.lc-data-guide")) {
        if (alpha(path) <= 0.12) continue;
        const matrix = path.getScreenCTM(), len = path.getTotalLength();
        for (let n = 0; n <= 60; n++) {
          const p = path.getPointAtLength((len * n) / 60), q = new DOMPoint(p.x, p.y).matrixTransform(matrix);
          const label = labels.find(b => q.x - root.x > b.x - 1 && q.x - root.x < b.x + b.w + 1 && q.y - root.y > b.y - 1 && q.y - root.y < b.y + b.h + 1);
          if (label) { crossed.push(label.text); break; }
        }
      }
      const imageCrossings = [];
      for (const sample of svg.querySelectorAll("[data-sample-object]")) {
        if (alpha(sample) <= 0.12) continue;
        const b = sample.getBoundingClientRect();
        for (const a of labels) {
          if (Math.min(a.x + a.w, b.right - root.x) - Math.max(a.x, b.left - root.x) > 2 && Math.min(a.y + a.h, b.bottom - root.y) - Math.max(a.y, b.top - root.y) > 2) imageCrossings.push([sample.dataset.sampleObject, a.text]);
        }
      }
      return { outside, pairs, crossed, imageCrossings };
    });
    check(result.outside.length === 0, `Lifecycle labels remain inside canvas: ${JSON.stringify(result.outside)}`);
    check(result.pairs.length === 0, `Lifecycle labels do not overlap: ${JSON.stringify(result.pairs)}`);
    check(result.crossed.length === 0, `Data/gradient corridors avoid labels at ${JSON.stringify(await state())}: ${JSON.stringify(result.crossed)}`);
    check(result.imageCrossings.length === 0, `Moving samples avoid labels at ${JSON.stringify(await state())}: ${JSON.stringify(result.imageCrossings)}`);
  };
  check((await state()).status === "playing", "Lifecycle starts a complete playback automatically");
  await scene.locator("[data-replay]").click();
  const copySamples = [];
  let record = null;
  for (let clip = 0; clip < 8; clip++) for (const p of [0.1, 0.25, 0.4, 0.5, 0.6, 0.7, 0.75, 0.9, 1]) {
    await at(clip, p);
    await geometry();
    check(await scene.locator("[data-current-model]").count() === 1, "Exactly one trainable model");
    if (clip < 2) check(await scene.locator("[data-history-z]").count() === 0, "No frozen block before copying");
    if (clip === 2) {
      copySamples.push(await scene.locator("[data-copy-point='0']").getAttribute("x"));
      check(await scene.locator("[data-response-plot]").isVisible(), "Original output stays visible throughout copying");
      check(await scene.locator("[data-history-z]").getAttribute("data-history-z") === "2,1,0", "Frozen z is exact while copying");
    }
    if (clip === 3) check(await scene.getAttribute("data-memory-count") === "0", "Parameter update precedes memory write");
    if (clip >= 4 && p >= 0.9) {
      record ??= await scene.locator("[data-record-id]").elementHandle();
      check(await record.evaluate(el => el === document.querySelector("[data-scene=lifecycle] [data-record-id]")), "Record DOM identity is continuous");
      check(await scene.getAttribute("data-memory-count") === "1", "Stored record and N persist after the write");
    }
    if (clip >= 5) check(await scene.getAttribute("data-replay-source") === "record:x1:i", "Replay reads the existing record");
    if (clip === 6 && p === 1) check(await scene.locator("[data-comparison]").isVisible(), "Comparison composition opens in the same stage");
    if ((clip === 2 && p === 0.5) || (clip === 4 && p === 0.75) || (clip === 5 && p === 0.5) || (clip === 6 && p === 0.75) || (clip === 7 && p === 1)) await shot(`lifecycle-${clip}-${p}`, "[data-scene=lifecycle] svg");
  }
  check(new Set(copySamples).size >= 6, "Copy squares move continuously through the inspected coordinates");
  await tick(2300);
  check((await state()).status === "finished", "A complete run finishes with its final result");
  check(await scene.getAttribute("data-update-count") === "2", "Exactly one update per shown training step");
  check(await scene.getAttribute("data-loss-sources") === "current-ce,historical-squared", "Two sources enter one later update");
  check(await scene.locator("[data-loss]").getAttribute("data-loss") === "2", "Live comparison has the computed squared loss");
  check(await scene.locator("[data-square-contribution]").count() === 2, "Zero-difference contributes a degenerate square instead of a value");
  await scene.locator("[data-replay]").click();
  await at(2, 0.5);
  await scene.locator("[data-play]").focus();
  await page.keyboard.press("Enter");
  const paused = await scene.locator("svg").innerHTML();
  await tick(800);
  check(await scene.locator("svg").innerHTML() === paused, "Pause freezes actual objects and labels");
  await scene.locator("[data-play]").click();
  const before = (await state()).p;
  await tick(120);
  check((await state()).p > before, "Continue resumes the same copy position");
  await scene.locator("select").selectOption("6");
  check((await state()).p === 1, "Jump exposes the complete selected result");
  await scene.locator("[data-back]").click();
  check((await state()).clip === 5 && await scene.getAttribute("data-memory-count") === "1", "Back restores the stored record");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await tick(50);
  for (let clip = 0; clip < 8; clip++) {
    await scene.locator("select").selectOption(String(clip));
    check((await state()).p === 1 && (await state()).status === "paused", "Reduced motion has a complete, stable semantic result");
    await geometry();
  }
  check(await scene.locator("[data-history-z]").getAttribute("data-history-z") === "2,1,0", "Reduced motion retains the historical record");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Lifecycle has no page horizontal overflow");
  const fontSize = await scene.locator(".lifecycle-reading p").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  assert.ok(fontSize >= 16);
  await page.clock.resume();
}
