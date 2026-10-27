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
  await page.goto(`${base}?review=1`, { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await shot("review-kl-default", ".kl-workspace");
  check(await page.locator("[data-contribution]").count() === 0 && await page.locator("[data-review-kl]").count() === 0, "Initial state does not reveal completed calculation");
  await page.locator("[data-kl-category='1']").click();
  await page.locator("#kl-definition .kl-q").click();
  check(await page.locator("[data-formula-part]").getAttribute("data-formula-part") === "1", "Clicking the typeset q symbol drives the same scene state");
  for (const part of [0, 1, 2]) {
    await page.locator(`[data-formula-select='${part}']`).click();
    const linked = await page.locator(".distribution-row[data-category='1'] [data-linked=true]").evaluateAll((nodes) => nodes.map((el) => el.dataset.probabilityObject));
    check(linked.join(",") === ["p", "q", "p,q"][part], "Formula focus selects corresponding real bars");
    check(await page.locator(".distribution-row[data-category='0'] [data-linked=true]").count() === 0, "Other class keeps context without stale focus");
  }
  await page.locator("[data-kl-step='2']").click();
  const negative = Number(await page.locator("[data-contribution]").nth(1).getAttribute("data-contribution"));
  check(negative < 0 && (await page.locator(".calculation-focus").innerText()).includes("负贡献"), "Negative term is explained as signed contribution");
  await shot("review-kl-negative", ".kl-workspace");
  for (const [id, expectedKL] of [["near", .09151622184943578], ["equal", 0], ["reversed", .8317766166719343]]) {
    await page.locator(`[data-review-q='${id}']`).click();
    check(await page.locator("[data-kl-stage]").getAttribute("data-kl-stage") === "0", "Changing q resets computation and focus");
    await page.locator("[data-formula-select='3']").click();
    const contributions = await page.locator("[data-contribution]").evaluateAll((nodes) => nodes.map((el) => Number(el.dataset.contribution)));
    const value = Number(await page.locator("[data-review-kl]").getAttribute("data-review-kl"));
    check(Math.abs(value - expectedKL) < 1e-12 && Math.abs(contributions.reduce((a, b) => a + b) - value) < 1e-12, "Actual signed terms sum to actual KL");
    check(await page.locator("[data-linked=true]").count() === 4, "Summation covers all class pairs");
  }
  await shot("review-kl-sum", ".kl-workspace");
  await page.locator("#review-kl .review-transport").getByRole("button", { name: "上一步", exact: true }).click();
  check(await page.locator("[data-formula-part]").getAttribute("data-formula-part") !== "3" && await page.locator("[data-review-kl]").count() === 0, "Backtracking removes summation focus and completed total");
  await shot("review-kl-derivation", "#review-kl .review-derivation");
  for (const [id, distance] of [["swapped", 2], ["shifted", 3]]) {
    await page.locator(`[data-review-a='${id}']`).click();
    check(await page.locator("[data-square]").count() === 0, "New example starts before squared contributions");
    await page.locator("[data-logit-step='1']").click();
    check((await page.locator("[data-delta]").evaluateAll((nodes) => nodes.map((el) => Number(el.dataset.delta)))).join(",") === (id === "shifted" ? "1,1,1" : "-1,1,0"), "Visual difference segments use actual a-z");
    await page.locator("[data-logit-step='2']").click();
    check((await page.locator("[data-square]").evaluateAll((nodes) => nodes.map((el) => Number(el.dataset.square)))).reduce((a, b) => a + b) === distance, "Squares form the correct loss");
    await page.locator("[data-logit-step='3']").click();
    check(Number(await page.locator("[data-review-squared]").getAttribute("data-review-squared")) === distance, "Loss reveals the same sum");
    if (id === "shifted") {
      const pairs = await page.locator(".probability-projection meter").evaluateAll((nodes) => nodes.map((el) => el.value));
      check(pairs.every((v, index) => index % 2 || Math.abs(v - pairs[index + 1]) < 1e-12), "All probabilities visibly coincide under common translation");
      check(Number(await page.locator("[data-review-probability-kl]").getAttribute("data-review-probability-kl")) === 0, "Common shift has KL=0");
    }
    // SVG nodes and labels must remain inside their declared plot.
    check(await page.locator(".aligned-logits").evaluate((svg) => [...svg.querySelectorAll("text,line,circle,path,rect")].every((node) => { const b = node.getBBox(); return b.x >= 0 && b.x + b.width <= 720 && b.y >= 0 && b.y + b.height <= 325; })), "Actual SVG geometry and labels fit plot");
    await shot(`review-logit-${id}`, ".score-workspace");
  }
  check(await page.locator("[data-history-z]").count() === 0 && await page.locator("[data-not-copied]").isVisible(), "Before copy there is no frozen history object");
  await shot("review-freeze-before", ".freeze-workspace");
  await page.locator("[data-freeze-step='1']").click();
  const record = await page.locator("[data-record-id]").elementHandle();
  for (const phase of [2, 3, 2, 1]) {
    await page.locator(`[data-freeze-step='${phase}']`).click();
    check(await record.evaluate((el) => el === document.querySelector("[data-record-id]")), "The same DOM object survives updates and backtracking");
    check(await page.locator("[data-history-z]").getAttribute("data-history-z") === "2,1,0", "Copied values stay fixed");
    if (phase >= 2) check(await page.locator("[data-current-parameter]").innerText() === "θₜ₊₁", "Only the current parameter version advances");
    if (phase === 3) check((await page.locator("[data-record-id]").innerText()).includes("尚未入池"), "Candidate is not falsely represented as stored memory");
    await page.locator(".snapshot-record").evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    check(await page.locator(".snapshot-record").evaluate((el) => { const b = el.getBoundingClientRect(), p = el.closest(".freeze-workspace").getBoundingClientRect(); return b.left >= p.left && b.right <= p.right; }), "Moving record fits the timeline container");
    if (phase === 2 || phase === 3) await shot(`review-freeze-${phase}`, ".freeze-workspace");
  }
  await page.locator(".site-header .text-button").click();
  await page.locator("[data-reference-term='softmax']").click();
  await page.locator("dialog .related-terms").getByRole("button", { name: "平方距离", exact: false }).click();
  await page.locator(".reference-back").click();
  check(await page.locator("[data-reference-detail='softmax']").isVisible(), "Related navigation supports return to previous entry");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-freeze-step='3']").click();
  check(await page.locator(".snapshot-record").evaluate((el) => getComputedStyle(el).transitionDuration === "0s"), "Reduced motion still exposes complete frozen record");
  const mathBoxes = await page.locator(".review-page math").evaluateAll((nodes) => nodes.map((el) => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, font: parseFloat(getComputedStyle(el).fontSize) })));
  check(mathBoxes.every((b) => b.width > 80 && b.height >= 20 && b.height < 140 && b.font >= 17), "Real MathML boxes have readable type and bounded line height");
  check(await page.locator("#kl-definition munderover").count() === 1 && await page.locator("#kl-definition mfrac").count() === 1, "KL keeps structured summation limits and fraction");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Prototypes have no page-wide overflow");
}
