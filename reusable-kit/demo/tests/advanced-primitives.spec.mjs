import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

async function capture(locator, name) {
  if (!process.env.PAPERWORK_REVIEW_DIR) return;
  await mkdir(process.env.PAPERWORK_REVIEW_DIR, { recursive: true });
  await locator.screenshot({ path: join(process.env.PAPERWORK_REVIEW_DIR, `${name}.png`) });
}

test("network focus preserves geometry and independent parallel model ownership", async ({ page }) => {
  await page.goto("/?demo=gallery#gallery-mini-network");
  const root = page.locator("#gallery-mini-network");
  const local = root.locator("[data-network-example='local']");
  const geometry = () => local.locator("[data-network-node]").evaluateAll(nodes => nodes.map(n => [n.dataset.networkNode, n.getAttribute("cx"), n.getAttribute("cy")]));
  const initial = await geometry();
  await capture(root, "network-full-and-parallel");
  expect(initial).toHaveLength(11);
  await expect(local.locator("[data-network-edge]")).toHaveCount(30);
  await local.getByRole("button", { name: "聚焦局部连接" }).click();
  await expect(local.locator("[data-network-edge].is-focused")).toHaveCount(2);
  expect(await geometry()).toEqual(initial);
  await capture(local, "network-focus");
  await expect(local).toContainText("不是自动计算的 Fisher");
  await local.getByRole("button", { name: "显示完整连接" }).click();
  expect(await geometry()).toEqual(initial);
  await expect(local.locator("[data-network-edge].is-focused")).toHaveCount(0);
  const paths = root.locator("[data-model-path]");
  expect(await paths.evaluateAll(nodes => nodes.map(n => [n.dataset.from, n.dataset.to]))).toEqual([["x", "teacher"], ["x", "student"]]);
  await expect(root.locator("[data-model='teacher'] [data-network-layer]")).toHaveCount(3);
  await expect(root.locator("[data-model='student'] [data-network-layer]")).toHaveCount(4);
  for (const model of ["teacher", "student"]) {
    await expect(root.locator(`[data-output-for='${model}']`)).toBeVisible();
    await expect(root.locator(`[data-model='${model}'] .rk-mini-network`)).toHaveCount(1);
  }
  await expect(root.locator("[data-model='teacher']")).toHaveCSS("border-top-style", "dashed");
  await expect(root.locator("[data-model='student']")).toHaveCSS("border-top-style", "solid");
  const labels = await root.locator("svg[aria-labelledby]").evaluateAll(nodes => nodes.map(n => n.getAttribute("aria-labelledby")));
  expect(new Set(labels).size).toBe(3);
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 900 });
    expect(await root.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await root.locator(".rk-mini-network__labels strong, h4, [data-output-for] strong").evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth && getComputedStyle(n).textOverflow !== "ellipsis"))).toBe(true);
    if (width > 520) {
      expect(await root.locator(".rk-mini-network").evaluateAll(glyphs => glyphs.every(glyph => [...glyph.querySelectorAll("[data-network-label]")].every(label => {
        const layer = glyph.querySelector(`[data-network-layer='${label.dataset.networkLabel}'] circle`);
        const a = layer.getBoundingClientRect(), b = label.getBoundingClientRect();
        return Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)) < 6;
      })))).toBe(true);
    }
    await capture(root, `network-${width}`);
    if (width === 1440) await capture(root.locator("[data-network-example='parallel']"), "network-parallel");
  }
});

async function expectSynchronized(root, id) {
  await expect(root).toHaveAttribute("data-stage", id);
  await expect(root.locator(".pg-forward-nav [aria-current='step']")).toHaveAttribute("data-stage-target", id);
  await expect(root.locator(".pg-forward-system [data-state='active']")).toHaveAttribute("data-object", id);
  for (const region of [".pg-forward-system", ".pg-forward-note", ".pg-forward-output", ".pg-forward-controls"]) {
    await expect(root.locator(region)).toHaveAttribute("data-stage", id);
  }
  await expect(root).toHaveAttribute("data-sample", "x1");
}

test("one forward timeline synchronizes navigation, objects, narrative and computed responses", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?demo=gallery#gallery-timeline");
  const root = page.locator("[data-timeline-example='forward']");
  await expectSynchronized(root, "sample");
  await capture(root, "timeline-start");
  await root.getByRole("button", { name: "播放 / 继续", exact: true }).click();
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(0.05);
  await root.getByRole("button", { name: "暂停", exact: true }).click();
  const paused = await root.getAttribute("data-progress");
  await page.waitForTimeout(100);
  await expect(root).toHaveAttribute("data-progress", paused);
  await capture(root, "timeline-paused");
  for (const stage of ["extractor", "representation", "scores"]) {
    await root.getByRole("button", { name: "下一阶段", exact: true }).click();
    await expectSynchronized(root, stage);
    await capture(root, `timeline-${stage}`);
  }
  await root.locator("[data-stage-target='extractor']").click();
  await expectSynchronized(root, "extractor");
  await root.getByRole("button", { name: "重播当前阶段", exact: true }).click();
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(0.05);
  await root.getByRole("button", { name: "重播当前阶段", exact: true }).click();
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(0.1);
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(0.38);
  await root.getByRole("button", { name: "暂停", exact: true }).click();
  await expectSynchronized(root, "extractor");
  await expect(root.locator(".pg-extractor-drawing [data-active='true']")).toHaveCount(1);
  await capture(root, "timeline-extractor-trace-paused");
  await root.locator("[data-stage-target='responses']").click();
  await expectSynchronized(root, "responses");
  await expect(root.locator("meter")).toHaveCount(3);
  const values = await root.locator("meter").evaluateAll(nodes => nodes.map(n => n.value));
  expect(values).toEqual([2, 0, -1].map(n => 1 / (1 + Math.exp(-n))));
  expect(await root.locator(".pg-head-score").evaluateAll(nodes => nodes.map(n => n.dataset.class))).toEqual(["1", "2", "3"]);
  expect(await root.locator(".pg-head-response").evaluateAll(nodes => nodes.map(n => n.dataset.class))).toEqual(["1", "2", "3"]);
  expect(values.reduce((sum, n) => sum + n, 0)).toBeGreaterThan(1);
  await expect(root.locator("math mfrac")).toHaveCount(1);
  await root.getByRole("button", { name: "重播当前阶段", exact: true }).click();
  await expect(root).toHaveAttribute("data-holding", "true");
  await capture(root, "timeline-hold");
  await expect(root).toHaveAttribute("data-status", "finished");
  await capture(root, "timeline-complete");
  await root.getByRole("button", { name: "重播当前阶段", exact: true }).click();
  await expect(root).toHaveAttribute("data-status", "playing");
  await root.getByRole("button", { name: "上一阶段", exact: true }).click();
  await expectSynchronized(root, "scores");
  await expect(root).toHaveAttribute("data-status", "paused");
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
    expect(await root.evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true);
    expect(await root.locator("button, h4, .pg-forward-system strong").evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth && getComputedStyle(n).textOverflow !== "ellipsis"))).toBe(true);
    expect(await root.locator(".pg-forward-object").evaluateAll(nodes => nodes.every(n => n.scrollHeight <= n.clientHeight + 1))).toBe(true);
    const sourceLabelsHaveSpace = await root.locator(".pg-forward-system > li").evaluateAll(nodes => nodes.every(n => {
      const object = n.querySelector(".pg-forward-object").getBoundingClientRect();
      const source = n.querySelector(".pg-forward-system__source").getBoundingClientRect();
      return object.bottom + 5 <= source.top;
    }));
    expect(sourceLabelsHaveSpace).toBe(true);
    if (width === 390) {
      await expect(root.locator("[data-input-from]")).toHaveCount(5);
      expect(await root.locator(".pg-forward-system").evaluate(n => getComputedStyle(n).gridTemplateColumns.split(" ").length)).toBe(1);
    }
    await capture(root, `timeline-${width}`);
  }
});

test("reduced motion keeps every semantic stage reachable without continuous playback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?demo=gallery#gallery-timeline");
  const root = page.locator("[data-timeline-example='forward']");
  for (const id of ["sample", "extractor", "representation", "scores", "responses"]) {
    await root.locator(`[data-stage-target='${id}']`).click();
    await expectSynchronized(root, id);
    await expect(root).toHaveAttribute("data-progress", "1.000");
    await expect(root).toHaveAttribute("data-status", "paused");
  }
  await capture(root, "timeline-reduced-motion");
  await root.getByRole("button", { name: "重播当前阶段", exact: true }).click();
  await expect(root).toHaveAttribute("data-progress", "1.000");
  await root.getByRole("button", { name: "上一阶段", exact: true }).click();
  await expectSynchronized(root, "scores");
});
