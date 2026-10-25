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
    await capture(root, `network-${width}`);
  }
});
