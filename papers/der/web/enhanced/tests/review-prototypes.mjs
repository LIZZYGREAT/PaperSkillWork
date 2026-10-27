import { animationBrowserChecks } from "./animation-browser.mjs";
import { lifecycleBrowserChecks } from "./lifecycle-browser.mjs";
// Semantic regressions for the proposals, plus term-specific content and real geometry.
export async function reviewPrototypeChecks({ page, base, check, shot }) {
  const expected = {
    kl: "为什么整体非负", ce: "硬标签", softmax: "分数怎样成为概率", logits: "同一个类别坐标",
    p: "固定的究竟是什么", q: "从哪里来", z: "先生成，再更新，后写入", a: "当前输出与冻结目标", squared: "逐类偏差、平方与求和",
  };
  // Inspect all nine real mainline term triggers, rather than only opening a dialog.
  for (const [id, content] of Object.entries(expected)) {
    const trigger = page.locator(`[data-term-id='${id}']`).first();
    await trigger.hover();
    const popup = page.locator(".rk-term-popover");
    await popup.waitFor({ state: "visible" });
    check((await popup.innerText()).includes("在本文中的作用") && (await popup.innerText()).includes("容易混淆"), `${id}: contextual hover organization`);
    check(await popup.evaluate((el) => { const b = el.getBoundingClientRect(); return b.left >= 11 && b.right <= innerWidth - 11 && b.top >= 11 && b.bottom <= innerHeight - 11; }), `${id}: hover fits viewport`);
    check(await popup.evaluate((el) => getComputedStyle(el).backgroundColor === "rgb(255, 253, 246)"), "Warm, light popover surface");
    if (id === "ce") await shot("review-hover-ce");
    await trigger.click();
    await page.mouse.move(2, 2);
    check(await popup.isVisible(), "Click pins the explanation for pointer/touch reading");
    await popup.getByRole("button", { name: "查看完整解释" }).click();
    check(await page.locator(`[data-reference-detail='${id}']`).isVisible(), `${id}: canonical entry opens`);
    check((await page.locator("dialog article").innerText()).includes(content), `${id}: detail matches the term`);
    if (["softmax", "ce", "p", "q", "z", "a", "logits"].includes(id)) check(await page.locator("dialog .reference-table").count() === 0, "Unrelated calculation table is absent");
    if (id === "softmax") {
      check(await page.locator("dialog math mfrac").count() >= 2, "Softmax has real fractional typesetting");
      await shot("review-softmax-reference", "dialog");
    }
    await page.keyboard.press("Escape");
    check(await trigger.evaluate((el) => el === document.activeElement), "Return to the exact term trigger");
    check(await page.locator(".reference-dialog").isVisible() === false, "Escape closes drawer");
    await page.keyboard.press("Escape");
  }
  // A real trigger is put at each viewport edge; no synthetic tooltip implementation.
  const edge = page.locator("[data-term-id='ce']").first();
  for (const corner of ["top-right", "bottom-right"]) {
    await edge.evaluate((el, value) => { el.style.position = "fixed"; el.style.right = "1px"; el.style.zIndex = "30"; el.style.top = value === "top-right" ? "1px" : "auto"; el.style.bottom = value === "bottom-right" ? "1px" : "auto"; }, corner);
    await edge.focus();
    await page.locator(".rk-term-popover").waitFor({ state: "visible" });
    check(await page.locator(".rk-term-popover").evaluate((el) => { const b = el.getBoundingClientRect(); return b.right <= innerWidth - 11 && b.bottom <= innerHeight - 11 && b.top >= 11; }), "Edge collision avoidance");
    await page.keyboard.press("Escape");
    check(await edge.getAttribute("aria-expanded") === "false", "Escape dismisses the focused popover");
    await edge.evaluate((el) => el.removeAttribute("style"));
    await page.locator(".site-header .text-button").focus();
  }
  await animationBrowserChecks({ page, base, check, shot });
  await lifecycleBrowserChecks({ page, base, check, shot });
}
