import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { transformSync } from "esbuild";

async function importExample(name) {
  const text = await readFile(new URL("../src/modules/" + name, import.meta.url), "utf8");
  const { code } = transformSync(text, { loader: "ts", format: "esm" });
  return import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
}

async function checkLayout(container, selector) {
  const issues = await container.evaluate((root, selector) => {
    const box = root.getBoundingClientRect();
    return [...root.querySelectorAll(selector)].flatMap(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const svg = node.ownerSVGElement;
      const font = parseFloat(style.fontSize) * (svg ? svg.getScreenCTM().a : 1);
      const outside = rect.left < box.left - 1 || rect.right > box.right + 1
        || rect.top < box.top - 1 || rect.bottom > box.bottom + 1;
      return outside || font < 13 || style.textOverflow === "ellipsis"
        || (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1)
        ? [{ text: node.textContent, font, outside }] : [];
    });
  }, selector);
  assert.deepEqual(issues, [], "Clipped or undersized teaching labels");
}

async function capture(page, locator, output, filename) {
  await locator.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  const frame = await locator.boundingBox();
  const viewport = page.viewportSize();
  const header = await page.locator(".site-header").boundingBox();
  assert(frame.y >= header.y + header.height - 1, filename + ": covered by navigation");
  assert(frame.y + frame.height <= viewport.height + 1, filename + ": frame extends below viewport");
  await page.screenshot({ path: path.join(output, filename + ".png") });
}

export async function checkP4(page, output, width) {
  const { P4_TRAINING_TRACE: trace, P4_TOY_EXPERIMENT: toy, runP4Forward } = await importExample("prompt-tuning-demo.ts");
  const frozen = JSON.stringify(toy.frozenWeights);
  assert(trace.gradientCheck.maxAbsoluteError < 1e-6);
  assert.deepEqual(runP4Forward(trace.updatedPrompt, trace.updatedClassifierWeights, trace.updatedClassifierBias), trace.updated);
  assert.equal(JSON.stringify(toy.frozenWeights), frozen);
  assert(trace.updated.loss < trace.initial.loss);
  const stage = page.locator(".p4-stage");
  const figure = page.locator(".p4-training-figure");
  const range = figure.getByRole("slider");
  const prompt = stage.locator(".p4-components");
  const promptValues = () => prompt.locator("div > span:last-child").allTextContents();
  const original = toy.prompt.flat().map(value => value.toFixed(3));
  const revised = trace.updatedPrompt.flat().map(value => value.toFixed(3));

  for (const [index, label] of ["input", "forward", "loss", "backward", "write", "rerun"].entries()) {
    await figure.locator(".p4-phase-list button").nth(index).click();
    assert.equal(await stage.getAttribute("data-phase"), String(index));
    await checkLayout(stage, ".p4-node h4, .p4-vector strong, .p4-attention strong, .p4-value, .p4-loss-value");
    assert.match(await stage.locator(".p4-frozen-status").innerText(), /权重固定.*梯度可通过/);
    await capture(page, figure, output, "P4-" + width + "-" + label);
    if (index < 4) assert.deepEqual(await promptValues(), original);
    if (index === 2) assert.equal(await stage.locator(".p4-loss-value").innerText(), trace.initial.loss.toFixed(3));
    if (index === 4) {
      assert.notDeepEqual(await promptValues(), original);
      assert.notDeepEqual(await promptValues(), revised);
      assert.equal(await stage.getAttribute("data-updates"), "0");
    }
  }
  assert.deepEqual(await promptValues(), revised);
  assert.equal(await stage.locator(".p4-loss-value").innerText(), trace.updated.loss.toFixed(3));
  assert.equal(await stage.getAttribute("data-updates"), "1");
  const traceDetails = page.locator(".p4-trace-details");
  await traceDetails.locator("summary").click();
  await checkLayout(traceDetails, "code");
  await traceDetails.locator("summary").click();

  // Continue in real time through the backward and update phases, then scrub back.
  await range.fill("11300");
  await figure.getByRole("button", { name: "播放过程" }).click();
  await page.waitForFunction(() => document.querySelector(".p4-stage").dataset.phase === "4");
  await page.waitForFunction(() => document.querySelector(".p4-stage").dataset.updates === "1");
  await figure.getByRole("button", { name: "暂停", exact: true }).click();
  const paused = await range.inputValue();
  await page.waitForTimeout(200);
  assert.equal(await range.inputValue(), paused);
  await range.press("End");
  await figure.getByRole("button", { name: "重播", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".p4-stage").dataset.phase === "0");
  await figure.getByRole("button", { name: "暂停", exact: true }).click();
  assert.deepEqual(await promptValues(), original);
}

