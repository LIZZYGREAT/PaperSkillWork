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

test("Component Lab exposes typography, button states, and responsive reading overlays", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator("[data-demo-view='component-lab']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Typography roles" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  const iconButton = page.getByRole("button", { name: "Add reference" });
  await expect(iconButton).toBeVisible();
  const iconBox = await iconButton.boundingBox();
  expect(iconBox.width).toBe(iconBox.height);

  const mediumButton = page.getByRole("button", { name: "Primary action" });
  expect(await mediumButton.evaluate((node) => getComputedStyle(node).minHeight)).toBe("44px");
  expect(await page.locator(".rk-type--body").first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);

  await page.getByRole("button", { name: "Open reading Drawer" }).click();
  const drawer = page.getByRole("dialog", { name: "Reading Drawer" });
  await expect(drawer).toBeVisible();
  const wideDrawer = await drawer.boundingBox();
  expect(wideDrawer.width).toBeGreaterThanOrEqual(800);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("button", { name: "Open reading Drawer" })).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open reading Drawer" }).click();
  await expect(drawer).toBeVisible();
  const narrowDrawer = await drawer.boundingBox();
  expect(narrowDrawer.width).toBeLessThanOrEqual(390);
  expect(await drawer.locator(".kit-lab__reading-grid").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(1);
});

test("scroll sections synchronize LwF steps, manual choice holds briefly, and EWC reuses the system view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "LwF scenario" }).click();
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

  await page.getByRole("button", { name: "EWC scenario" }).click();
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
  const panelFor = async (trigger) => {
    const panelId = await trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    return page.locator(`[id="${panelId}"]`);
  };
  await page.setViewportSize(viewport);
  await page.goto("/tests.html");
  await expect(page.locator("#summary")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  await page.getByRole("dialog", { name: "Demo figure" }).getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog", { name: "Demo figure" })).toBeHidden();

  const repeatedTriggers = page.locator('.rk-term-ref[data-term-id="term-a"]');
  const repeatedControls = await repeatedTriggers.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-controls")));
  expect(repeatedControls.length).toBeGreaterThanOrEqual(2);
  expect(new Set(repeatedControls).size).toBe(repeatedControls.length);

  const wrapper = page.locator(".rk-term-ref-wrap").first();
  const trigger = wrapper.locator(".rk-term-ref");
  const panel = await panelFor(trigger);
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

  await trigger.evaluate((node) => node.blur());
  await page.mouse.move(viewport.width - 1, 1);
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
  const keyboardPanel = await panelFor(keyboardTrigger);
  await page.locator("#keyboard-target").focus();
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
  await keyboardPanel.getByRole("button", { name: "查看完整解释" }).click();
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
    const mobilePanelId = await mobileTrigger.getAttribute("aria-controls");
    const mobilePanel = mobilePage.locator(`[id="${mobilePanelId}"]`);
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

test("Chinese hover opens the exact English Hub entry without changing the paper anchor", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "EWC scenario" }).click();
  await page.locator("#ewc-update").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.history.replaceState(null, "", "#ewc-update"));

  const trigger = page.locator('.rk-term-ref[data-term-id="fisher"]');
  await trigger.click();
  const panelId = await trigger.getAttribute("aria-controls");
  const hover = page.locator(`[id="${panelId}"]`);
  await expect(hover).toContainText("如果某个参数对旧任务模型的预测分布更敏感");
  await hover.getByRole("button", { name: "查看完整解释" }).click();

  const drawer = page.getByRole("dialog", { name: "Reference Hub" });
  const hub = drawer.locator(".rk-reference-hub");
  await expect(drawer).toBeVisible();
  await expect(hub.getByRole("heading", { name: "Diagonal Fisher importance estimate" })).toBeVisible();
  await expect(hub.locator('[data-reference-id="fisher"]')).toHaveAttribute("aria-current", "true");
  expect(await page.evaluate(() => window.location.hash)).toBe("#ewc-update");

  const visibleCopy = await hub.innerText();
  expect(visibleCopy).not.toMatch(/[\u3400-\u9fff]/);
  const ariaCopy = await hub.locator("[aria-label]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label") ?? "").join(" "));
  expect(ariaCopy).not.toMatch(/[\u3400-\u9fff]/);

  await hub.getByRole("searchbox", { name: "Search references" }).fill("Stored earlier");
  await expect(hub.getByRole("heading", { name: "Diagonal Fisher importance estimate" })).toBeVisible();
  await hub.getByRole("button", { name: "Stored earlier-task optimum θ*" }).last().click();
  await expect(hub.getByRole("heading", { name: "Stored earlier-task optimum θ*" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(hub.locator(".rk-reference-hub__list")).toBeHidden();
  await hub.getByRole("button", { name: "Back to reference list" }).click();
  await expect(hub.locator(".rk-reference-hub__list")).toBeVisible();
  await expect(hub.locator(".rk-reference-hub__detail")).toBeHidden();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});
