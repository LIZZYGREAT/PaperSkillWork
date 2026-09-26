import { expect, test } from "@playwright/test";

test("component interaction assertions pass in a real browser", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/tests.html");

  const summary = page.locator("#summary");
  await expect(summary).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  const passed = Number(await summary.getAttribute("data-pass-count"));
  expect(passed).toBeGreaterThanOrEqual(18);
  expect(await page.locator("#summary + ol li").count()).toBe(passed);
  expect(pageErrors).toEqual([]);
});

test("scroll sections synchronize LwF steps, manual choice holds briefly, and EWC reuses the system view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const system = page.locator(".rk-sticky-system");
  const processTitle = page.locator(".rk-process-loop__step-heading h3").first();

  await page.locator("#lwf-loss").scrollIntoViewIfNeeded();
  await expect(system).toHaveAttribute("data-active-step-id", "loss");
  await expect(processTitle).toHaveText("Combine the two objectives");

  await page.locator(".rk-process-loop").first().getByLabel("Select process step").selectOption("teacher");
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await page.waitForTimeout(180);
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await expect(processTitle).toHaveText("Keep the old model fixed");
  await expect(page.locator(".rk-flow-step[aria-current='step']")).toContainText("Teacher");
  await expect(system).toHaveAttribute("data-active-step-id", "loss", { timeout: 2500 });
  await expect(page.locator(".rk-flow-step[aria-current='step']")).toContainText("Losses");

  await page.locator("#lwf-update .rk-flow-step").filter({ hasText: "Teacher" }).click();
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await expect(processTitle).toHaveText("Keep the old model fixed");

  await page.getByRole("button", { name: "EWC mini demo" }).click();
  await expect(page.getByRole("heading", { name: "Elastic Weight Consolidation (EWC)" })).toBeVisible();
  await page.locator("#ewc-penalty").scrollIntoViewIfNeeded();
  await expect(system).toHaveAttribute("data-active-step-id", "penalty");
  await expect(processTitle).toHaveText("Form the EWC penalty");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#ewc-stored").evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35, behavior: "instant" }));
  await expect(system).toHaveAttribute("data-active-step-id", "store");
  await expect.poll(() => page.locator(".rk-sticky-system__visual").evaluate((node) => getComputedStyle(node).position)).toBe("static");
});
