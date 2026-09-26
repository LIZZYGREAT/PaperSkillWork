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

test("TermRef shares viewport-safe placement, hover, keyboard, and touch behavior", async ({ page, browser }) => {
  const viewport = { width: 390, height: 844 };
  await page.setViewportSize(viewport);
  await page.goto("/tests.html");
  await expect(page.locator("#summary")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  await page.getByRole("dialog", { name: "Demo figure" }).getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog", { name: "Demo figure" })).toBeHidden();

  const wrapper = page.locator(".rk-term-ref-wrap").first();
  const trigger = wrapper.locator(".rk-term-ref");
  const panel = page.locator("#rk-term-term-a");
  const moveAnchor = (left, top) => wrapper.evaluate((node, point) => {
    Object.assign(node.style, { position: "fixed", zIndex: "1200", left: `${point.left}px`, top: `${point.top}px` });
  }, { left, top });
  const checkBounds = async () => {
    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.x).toBeGreaterThanOrEqual(12);
    expect(bounds.y).toBeGreaterThanOrEqual(12);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - 12);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 12);
    return bounds;
  };

  await moveAnchor(0, 190);
  await trigger.hover();
  await expect(panel).toBeVisible();
  await checkBounds();
  const panelBox = await panel.boundingBox();
  await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + panelBox.height / 2);
  await expect(panel).toBeVisible();
  await page.mouse.move(viewport.width - 1, 1);
  await expect(panel).toBeHidden();

  await moveAnchor(viewport.width - 40, 190);
  await trigger.hover();
  await expect(panel).toBeVisible();
  await checkBounds();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  await moveAnchor(150, viewport.height - 48);
  await trigger.click();
  await expect(panel).toBeVisible();
  await checkBounds();
  const panelBelowAnchor = await panel.boundingBox();
  const triggerBounds = await trigger.boundingBox();
  expect(panelBelowAnchor.y + panelBelowAnchor.height).toBeLessThanOrEqual(triggerBounds.y);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  await page.goto("/tests.html");
  await expect(page.locator("#summary")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  await page.getByRole("dialog", { name: "Demo figure" }).getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog", { name: "Demo figure" })).toBeHidden();
  const keyboardTrigger = page.locator(".rk-term-ref").first();
  const keyboardPanel = page.locator("#rk-term-term-a");
  await keyboardTrigger.focus();
  await expect(keyboardPanel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(keyboardPanel).toBeHidden();
  await expect(keyboardTrigger).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(keyboardTrigger).toBeFocused();
  await expect(keyboardPanel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(keyboardPanel).toBeHidden();

  await keyboardTrigger.click();
  await expect(keyboardPanel).toBeVisible();
  await keyboardPanel.getByRole("button", { name: "Open in Reference Hub" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-reference", "term-a");
  await expect(keyboardPanel).toBeHidden();

  const mobileContext = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  try {
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(new URL("/tests.html", page.url()).toString());
    await expect(mobilePage.locator("#summary")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
    await mobilePage.getByRole("dialog", { name: "Demo figure" }).getByRole("button", { name: "Close" }).click();
    await expect(mobilePage.getByRole("dialog", { name: "Demo figure" })).toBeHidden();
    const mobileWrapper = mobilePage.locator(".rk-term-ref-wrap").first();
    await mobileWrapper.evaluate((node) => Object.assign(node.style, { position: "fixed", zIndex: "1200", left: "350px", top: "790px" }));
    const mobileTrigger = mobileWrapper.locator(".rk-term-ref");
    const mobilePanel = mobilePage.locator("#rk-term-term-a");
    await mobilePage.tap(".rk-term-ref");
    await expect(mobilePanel).toBeVisible();
    const mobileBounds = await mobilePanel.boundingBox();
    expect(mobileBounds.x).toBeGreaterThanOrEqual(12);
    expect(mobileBounds.y).toBeGreaterThanOrEqual(12);
    expect(mobileBounds.x + mobileBounds.width).toBeLessThanOrEqual(viewport.width - 12);
    expect(mobileBounds.y + mobileBounds.height).toBeLessThanOrEqual(viewport.height - 12);
    await mobilePage.tap(".rk-term-ref");
    await expect(mobilePanel).toBeHidden();
    await expect(mobileTrigger).toHaveAttribute("aria-expanded", "false");
  } finally {
    await mobileContext.close();
  }
});
