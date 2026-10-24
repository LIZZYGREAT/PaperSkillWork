import { expect, test } from "@playwright/test";

test("editorial studies preserve the EWC handoff and keyboard reset", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (process.env.EDITORIAL_REVIEW_CAPTURE) await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?demo=editorial");
  const study = page.locator(".ed-study");
  const ledger = study.locator(".ed-study__ledger");
  const nav = study.getByRole("list", { name: "检查 EWC 交接阶段" });
  const stageIds = ["learn-a", "save", "estimate", "use-b"];
  const titles = ["先完成任务 A", "把参考位置留下", "再估计重要性", "在任务 B 中读取"];
  const captureHandoff = async (id) => {
    if (!process.env.EDITORIAL_REVIEW_CAPTURE) return;
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.evaluate(() => scrollTo(0, 0));
    const box = await page.locator("#ed-b").boundingBox();
    await page.screenshot({ fullPage: true, clip: box, path: testInfo.outputPath(`ed-b-${id}-1440.png`) });
    await page.evaluate(y => scrollTo(0, y), scrollBefore);
  };
  const checkChronicle = async (index) => {
    const moments = study.locator(".ed-study__chronicle > li");
    await expect(study.locator(".ed-study__chronicle > li[aria-current='step']")).toHaveCount(1);
    for (let i = 0; i < stageIds.length; i++) {
      const row = moments.nth(i);
      await expect(row).toHaveAttribute("data-stage", stageIds[i]);
      await expect(row).toHaveAttribute("data-phase", i === index ? "current" : i < index ? "completed" : "upcoming");
      await expect(row.locator("h3")).toHaveText(titles[i]);
      await expect(row.locator(".ed-study__phase-label")).toHaveText(i === index ? "当前阶段" : i < index ? "已完成" : "后续预览");
      await expect(row.locator(".ed-study__moment-copy")).toBeVisible();
      await expect(row.locator(".ed-study__moment-visual")).toBeVisible();
      // Current focus covers the narrative title and state expression, not only a numbered marker.
      expect(await row.locator("h3").evaluate(n => getComputedStyle(n).textDecorationLine.includes("underline"))).toBe(i === index);
      const symbols = await row.locator(".ed-study__moment-visual [data-state-object]").evaluateAll(nodes => nodes.map(n => ({
        background: getComputedStyle(n).backgroundColor,
        // Decorating a MathML base/subscript separately produces broken lines resembling notation.
        underlined: [n, ...n.querySelectorAll("*")].some(part => getComputedStyle(part).textDecorationLine.includes("underline")),
      })));
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols.every(s => !s.underlined)).toBe(true);
      if (i === index) {
        const focusBackground = await row.locator(".ed-study__moment-copy").evaluate(n => getComputedStyle(n).backgroundColor);
        expect(symbols.every(s => s.background === focusBackground)).toBe(true);
      } else {
        expect(symbols.every(s => s.background === "rgba(0, 0, 0, 0)")).toBe(true);
      }
    }
    const available = ledger.locator("dl > div");
    await expect(available.first()).toHaveAttribute("data-availability", index === 0 ? "generated" : "stored");
    await expect(available.last()).toHaveAttribute("data-availability", index < 2 ? "unavailable" : "stored");
    expect(await moments.locator(".ed-study__moment-visual").evaluateAll(nodes => nodes.every(n => getComputedStyle(n).transitionDuration === "0s"))).toBe(true);
  };
  await expect(ledger).toHaveAttribute("data-stage", "learn-a");
  await expect(ledger.locator("dd")).toHaveText(["已生成 · 尚未保存副本", "尚未估计"]);
  await checkChronicle(0);
  await captureHandoff("learn-a");
  await nav.scrollIntoViewIfNeeded();
  for (const [id, values, task] of [
    ["save", ["已保存 · 后续保持固定", "尚未估计"], "B 尚未开始"],
    ["estimate", ["继承已保存副本", "由 A 估计并保存"], "B 尚未开始"],
    ["use-b", ["读取已保存副本", "读取 A 的重要性"], "B 训练中 · θ 可更新"],
  ]) {
    const scrollBefore = await page.evaluate(() => scrollY);
    await nav.locator(`[data-step-id='${id}']`).click();
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(scrollBefore, 0);
    await expect(ledger).toHaveAttribute("data-stage", id);
    await expect(ledger.locator("dd")).toHaveText(values);
    await expect(ledger.locator(".ed-study__ledger-task")).toHaveText(task);
    await checkChronicle(stageIds.indexOf(id));
    if (["estimate", "use-b"].includes(id)) await captureHandoff(id);
  }
  // A backward selection restores availability; it must not retain future Fisher state.
  await nav.locator("[data-step-id='save']").focus();
  await page.keyboard.press("Enter");
  await expect(ledger.locator("dd").last()).toHaveText("尚未估计");
  await checkChronicle(1);
  for (const index of [3, 0, 2, 1]) {
    await nav.locator(`[data-step-id='${stageIds[index]}']`).click();
    await checkChronicle(index);
  }
  const reset = study.getByRole("button", { name: "重置交接" });
  await reset.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  const ring = await reset.evaluate(n => {
    const s = getComputedStyle(n);
    return { width: s.outlineWidth, style: s.outlineStyle, visible: n.matches(":focus-visible") };
  });
  expect(ring).toEqual({ width: "3px", style: "solid", visible: true });
  await page.keyboard.press("Space");
  await expect(ledger).toHaveAttribute("data-stage", "learn-a");
  await expect(ledger.locator("dd")).toHaveText(["已生成 · 尚未保存副本", "尚未估计"]);
  await checkChronicle(0);
  // Returning to an existing demo after the experiment preserves its independent state.
  await page.getByRole("button", { name: "EWC scenario", exact: true }).click();
  await expect(study).toHaveCount(0);
  await expect(page.locator(".kit-ewc-panel")).toHaveAttribute("data-focus-step", "old");
});

test("editorial compositions reflow at every requested viewport with readable mathematics", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto("/?demo=editorial#ed-c");
  await expect(page.locator("#ed-c-title")).toBeInViewport();
  await page.goto("/");
  await page.getByRole("button", { name: "Editorial studies", exact: true }).click();
  for (const [width, height] of [[1280, 900], [1440, 900], [1920, 1080], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    for (const id of ["ed-a", "ed-b", "ed-c"]) {
      await page.locator(`.ed-study__opening a[href='#${id}']`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      const diagnostics = await page.locator(`#${id}`).evaluate(section => {
        const box = section.getBoundingClientRect();
        const nodes = [...section.querySelectorAll("h2, h3, p, math, .ed-study__weight, .rk-step-nav__label, .ed-study__signal strong")];
        return {
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
          bad: nodes.flatMap(n => {
            const r = n.getBoundingClientRect(), s = getComputedStyle(n);
            return r.left < box.left - 1 || r.right > box.right + 1 || n.scrollWidth > n.clientWidth + 1 || s.textOverflow === "ellipsis" || parseFloat(s.fontSize) < 12 ? [n.textContent] : [];
          }),
          sizes: [...section.querySelectorAll("math")].map(n => parseFloat(getComputedStyle(n).fontSize)),
          clippedMath: [...section.querySelectorAll("math msub, math msubsup, math mfrac")].filter(n => {
            const r = n.getBoundingClientRect(), m = n.closest("math").getBoundingClientRect();
            return r.left < m.left - 1 || r.right > m.right + 1 || r.top < m.top - 1 || r.bottom > m.bottom + 1;
          }).map(n => n.textContent),
        };
      });
      expect(diagnostics.pageOverflow, `${width}/${id}`).toBe(false);
      expect(diagnostics.bad, `${width}/${id}`).toEqual([]);
      expect(diagnostics.sizes.every(n => n >= 18)).toBe(true);
      expect(diagnostics.clippedMath, `${width}/${id} mathematical bounds`).toEqual([]);
      if (id === "ed-a") {
        const emphasis = page.locator("#ed-a strong.ed-study__emphasis");
        await expect(emphasis).toHaveText("并非所有参数，都应被同等保护。");
        const reading = await emphasis.evaluate(n => {
          const p = n.parentElement, bounds = p.getBoundingClientRect(), s = getComputedStyle(p);
          const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), lines = [];
          const range = document.createRange();
          for (let text = walker.nextNode(); text; text = walker.nextNode()) for (let i = 0; i < text.length; i++) {
            range.setStart(text, i); range.setEnd(text, i + 1);
            const r = range.getBoundingClientRect();
            let line = lines.find(l => Math.abs(l.top - r.top) < 1);
            if (!line) { line = { top: r.top, count: 0 }; lines.push(line); }
            line.count++;
          }
          range.selectNodeContents(n);
          return { ratio: parseFloat(getComputedStyle(n).fontSize) / parseFloat(s.fontSize),
            badRects: [...range.getClientRects()].filter(r => r.left < bounds.left - 1 || r.right > bounds.right + 1 || r.height > parseFloat(s.lineHeight) * 1.15).length,
            lastLineChars: lines.at(-1).count };
        });
        expect(reading.ratio).toBeGreaterThanOrEqual(1.10);
        expect(reading.ratio).toBeLessThanOrEqual(1.18);
        expect(reading.badRects).toBe(0);
        expect(reading.lastLineChars).toBeGreaterThan(2);
      }
      if (process.env.EDITORIAL_REVIEW_CAPTURE && [1440, 390].includes(width)) {
        await page.evaluate(() => scrollTo(0, 0));
        const box = await page.locator(`#${id}`).boundingBox();
        await page.screenshot({ fullPage: true, clip: box, path: testInfo.outputPath(`${id}-${width}.png`) });
      }
    }
    await page.locator("#ed-b [data-step-id='use-b']").click();
    await expect(page.locator(".ed-study__ledger")).toHaveAttribute("data-stage", "use-b");
    await page.getByRole("button", { name: "重置交接" }).click();
    if (width === 390) {
      expect(await page.locator(".ed-study__roles").evaluate(n => getComputedStyle(n).gridTemplateColumns.split(" ").length)).toBe(1);
      expect(await page.locator(".ed-study__moment-visual").first().evaluate(n => getComputedStyle(n).gridRowStart)).toBe("2");
    }
  }
  const bars = await page.locator(".ed-study__weight").evaluateAll(nodes => nodes.map(n => ({
    value: Number(n.dataset.weight), ratio: n.querySelector(".ed-study__weight-track > span").getBoundingClientRect().width / n.querySelector(".ed-study__weight-track").getBoundingClientRect().width,
  })));
  for (const bar of bars) expect(bar.ratio).toBeCloseTo(bar.value, 2);
  await expect(page.locator("#ed-a .ed-study__caption")).toContainText("教学示意，非论文实验结果");
  await expect(page.locator("#ed-b math mfrac")).toHaveCount(1);
  await expect(page.locator("#ed-b math munder")).toHaveCount(1);
  await expect(page.locator("#ed-b math msup")).toHaveCount(1);
  await expect(page.locator("#ed-c .ed-study__teacher")).toContainText("不接收梯度");
  await expect(page.locator("#ed-c .ed-study__signal")).toHaveCount(2);
  for (const [loss, target] of [["old", "与 teacher 的旧响应目标比较"], ["new", "与当前任务的真实标签比较"]]) {
    const comparison = page.locator(`#ed-c .ed-study__signal[data-loss='${loss}']`);
    const term = page.locator(`#ed-c .ed-study__convergence math [data-loss-term='${loss}']`);
    await expect(comparison.locator("p")).toHaveText(target);
    await expect(comparison.locator("[data-loss-term] sub")).toHaveText(loss);
    await expect(term.locator("mi")).toHaveText("L");
    await expect(term.locator("mtext")).toHaveText(loss);
    // The same symbol and visual cue continue from each comparison to its actual MathML term.
    const cue = await comparison.locator("strong").evaluate(n => ({ ink: getComputedStyle(n).color, rule: getComputedStyle(n).borderBottomStyle }));
    const formulaCue = await term.evaluate(n => {
      const s = getComputedStyle(n.closest("[data-loss]"));
      return { ink: s.color, rule: s.borderBottomStyle };
    });
    expect(formulaCue).toEqual(cue);
  }
  await expect(page.locator("#ed-c .ed-study__convergence > div:first-child math")).toHaveText("J=λoLold+Lnew+R");
  await expect(page.locator("#ed-c .ed-study__gradient math msub")).toHaveCount(2);
  await expect(page.locator("#ed-c .ed-study__gradient")).toContainText("再对 student 的可训练参数求导");
  await expect(page.locator("#ed-c .ed-study__formula-note")).toContainText("warm-up 只训练新任务参数");
  await expect(page.locator("#ed-c .ed-study__update")).toContainText("只更新 student");
  expect(errors).toEqual([]);
});

test("C candidates preserve the baseline and explain one student update across viewports", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  const captureSection = async (id, path) => {
    await page.evaluate(() => scrollTo(0, 0));
    const box = await page.locator(`#${id}`).boundingBox();
    return page.screenshot({ fullPage: true, clip: box, ...(path ? { path } : {}) });
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?demo=editorial");
  await page.evaluate(() => document.fonts.ready);
  const baseline = await page.locator("#ed-c").evaluate(n => n.outerHTML);
  const originalAB = await page.locator("#ed-a, #ed-b").evaluateAll(nodes => nodes.map(n => n.outerHTML));
  const originalImages = [await captureSection("ed-a"), await captureSection("ed-b")];
  await page.goto("/?demo=editorial&c=unrecognized#ed-c");
  expect(await page.locator("#ed-c").evaluate(n => n.outerHTML)).toBe(baseline);

  for (const variant of ["c1", "c2"]) {
    for (const [width, height] of [[1280, 900], [1440, 900], [1920, 1080], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`/?demo=editorial&c=${variant}#ed-c`);
      await page.evaluate(() => document.fonts.ready);
      const c = page.locator("#ed-c");
      await expect(c).toHaveAttribute("data-c-variant", variant);
      await expect(c.locator("#ed-c-title")).toBeInViewport();
      const teacher = c.locator("[data-role='teacher']");
      const student = c.locator("[data-role='student']");
      await expect(teacher).toContainText("不接收梯度");
      await expect(teacher).toContainText("预先记录");
      await expect(teacher.locator("[data-equation]")).toHaveCount(0);
      await expect(student.locator("[data-parameter-definition]")).toContainText("student 的可训练参数");
      for (const [kind, output, target] of [["old", "旧类输出", "teacher 的旧响应目标"], ["new", "新类输出", "当前任务的真实标签"]]) {
        const comparison = student.locator(`[data-comparison='${kind}']`);
        await expect(comparison).toContainText(output);
        await expect(comparison).toContainText(target);
        await expect(comparison.locator("sub")).toHaveText(kind);
        const term = student.locator(`[data-equation='objective'] [data-loss-term='${kind}']`);
        await expect(term).toContainText(`L${kind}`);
      }
      await expect(student.locator("[data-equation='objective']")).toHaveText("J=λoLold+Lnew+R");
      const update = student.locator("[data-update-target='student']");
      await expect(update.locator("[data-equation='parameter-update']")).toHaveText("θs←θs−η∇θsJ");
      await expect(update).toContainText("对 J 求导");
      expect(await student.evaluate(n => !!(n.querySelector("[data-stage='objective']").compareDocumentPosition(n.querySelector("[data-stage='update']")) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
      const note = c.locator(".ed-c-mechanism-note");
      for (const text of ["联合优化阶段", "温度变换并重新归一化", "旧损失权重", "权重衰减", "warm-up 只训练新任务参数", "梯度下降教学示意", "不是论文原图或实验结果"]) await expect(note).toContainText(text);
      if (variant === "c2") {
        await expect(c.locator("[data-role='current-labels']")).toContainText("来自当前任务数据");
        expect(await c.locator("[data-role='current-labels']").evaluate(n => n.closest("[data-role='student']") === null)).toBe(true);
        await expect(student.locator("[data-part='shared-representation']")).toContainText("两路输出");
      }
      const layout = await c.evaluate(section => {
        const bounds = section.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          bad: [...section.querySelectorAll("h2,h3,h4,p,math,[data-loss-result]")].filter(n => {
            const r = n.getBoundingClientRect(), s = getComputedStyle(n);
            return r.left < bounds.left - 1 || r.right > bounds.right + 1 || n.scrollWidth > n.clientWidth + 1 || s.textOverflow === "ellipsis" || parseFloat(s.fontSize) < 12;
          }).map(n => n.textContent),
          clippedMath: [...section.querySelectorAll("math msub,math mrow")].filter(n => {
            const r = n.getBoundingClientRect(), m = n.closest("math").getBoundingClientRect();
            return r.left < m.left - 1 || r.right > m.right + 1 || r.top < m.top - 1 || r.bottom > m.bottom + 1;
          }).map(n => n.textContent),
        };
      });
      expect(layout, `${variant} at ${width}`).toEqual({ overflow: false, bad: [], clippedMath: [] });
      if (width === 1440) {
        expect(await page.locator("#ed-a, #ed-b").evaluateAll(nodes => nodes.map(n => n.outerHTML))).toEqual(originalAB);
        for (const [index, id] of ["ed-a", "ed-b"].entries()) expect((await captureSection(id)).equals(originalImages[index]), `${id} pixels unchanged in ${variant}`).toBe(true);
      }
      if (process.env.EDITORIAL_REVIEW_CAPTURE) {
        await captureSection("ed-c", testInfo.outputPath(`${variant}-${width}-full.png`));
        if (width === 1440) {
          await c.evaluate(n => scrollTo(0, n.getBoundingClientRect().top + scrollY - document.querySelector(".kit-topbar").getBoundingClientRect().height - 16));
          await page.screenshot({ path: testInfo.outputPath(`${variant}-1440-opening.png`) });
        }
      }
    }
  }
  // The preview controls remain native links, including a keyboard route back to baseline.
  await page.locator(".ed-c-preview-links a").filter({ hasText: "C1" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ed-c")).toHaveAttribute("data-c-variant", "c1");
  await page.getByRole("link", { name: "Baseline", exact: true }).focus();
  await page.keyboard.press("Enter");
  expect(await page.locator("#ed-c").evaluate(n => n.outerHTML)).toBe(baseline);
  expect(errors).toEqual([]);
});

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
  await expect(page.locator(".kit-shell")).toHaveAttribute("data-visual-direction", "warm");
  await expect(page.getByText("Every component stays a candidate until a named human accepts the rendered result.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tokens and type roles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page compositions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Diagram roles" })).toBeVisible();
  await expect(page.locator(".kit-lab .rk-section-head__title")).toHaveText("章节开头用同一种结构");
  await expect(page.locator(".kit-lab .rk-figure__title")).toHaveText("图有自己的抬头与编号");
  await expect(page.locator(".kit-lab .rk-meta-list__row")).toHaveCount(3);
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

test("LwF opening keeps the title compact and the causal figure complete", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "LwF scenario" }).click();

  const headingMetrics = await page.locator(".kit-lwf__hero h2").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { fontSize: Number.parseFloat(getComputedStyle(node).fontSize), height: rect.height };
  });
  expect(headingMetrics.fontSize).toBeGreaterThanOrEqual(28);
  expect(headingMetrics.fontSize).toBeLessThanOrEqual(52);
  expect(headingMetrics.height).toBeLessThanOrEqual(130);

  const heroHeight = await page.locator(".kit-lwf__hero").evaluate((node) => node.getBoundingClientRect().height);
  expect(heroHeight).toBeLessThanOrEqual(900 * 0.4);

  const figure = page.locator(".kit-lwf-panel .rk-diagram");
  await expect(figure).toHaveAttribute("data-diagram-mode", "grid");
  const figureBox = await figure.boundingBox();
  expect(figureBox.width).toBeGreaterThanOrEqual(700);
  expect(figureBox.height).toBeGreaterThanOrEqual(320);

  // Every labelled step keeps its full text: no ellipsis and no horizontal clipping.
  const navLabels = await page.locator(".kit-lwf-panel .rk-step-nav__label").evaluateAll((nodes) => nodes.map((node) => ({
    text: (node.textContent ?? "").trim(),
    textOverflow: getComputedStyle(node).textOverflow,
    whiteSpace: getComputedStyle(node).whiteSpace,
    clipped: node.scrollWidth > node.clientWidth + 1,
    fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
  })));
  expect(navLabels.map((label) => label.text)).toEqual([
    "新任务到来冲突",
    "冻结 teacher目标",
    "同一输入的两路输出预测",
    "形成两个损失比较",
    "更新 student梯度",
  ]);
  expect(navLabels.every((label) => label.textOverflow !== "ellipsis")).toBe(true);
  expect(navLabels.every((label) => label.whiteSpace !== "nowrap")).toBe(true);
  expect(navLabels.filter((label) => label.clipped)).toEqual([]);
  expect(navLabels.every((label) => label.fontSize >= 12)).toBe(true);

  // In-figure text keeps its role size instead of being scaled down to fit.
  const figureType = await page.locator(".kit-lwf-panel [data-diagram-node] .rk-diagram__title").evaluateAll((nodes) => nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize)));
  expect(figureType.length).toBe(10);
  expect(figureType.every((size) => size >= 14)).toBe(true);

  // Every key object and every connector stays inside the figure box.
  const geometryProblems = await page.locator(".kit-lwf-panel .rk-diagram__canvas").evaluate((canvas) => {
    const box = canvas.getBoundingClientRect();
    const problems = [];
    for (const node of canvas.querySelectorAll("[data-diagram-node]")) {
      const rect = node.getBoundingClientRect();
      if (rect.left < box.left - 1 || rect.top < box.top - 1 || rect.right > box.right + 1 || rect.bottom > box.bottom + 1) {
        problems.push(`${node.getAttribute("data-diagram-node")} outside the figure box`);
      }
      if (rect.width < 90 || rect.height < 40) problems.push(`${node.getAttribute("data-diagram-node")} is too small to read`);
    }
    const svg = canvas.querySelector(".rk-diagram__edges");
    for (const path of svg.querySelectorAll(".rk-diagram__edge path")) {
      const bbox = path.getBBox();
      if (bbox.x < -1 || bbox.y < -1 || bbox.x + bbox.width > box.width + 1 || bbox.y + bbox.height > box.height + 1) {
        problems.push(`connector outside the figure box at ${Math.round(bbox.x)},${Math.round(bbox.y)}`);
      }
    }
    return { problems, connectors: svg.querySelectorAll(".rk-diagram__edge").length };
  });
  expect(geometryProblems.problems).toEqual([]);
  expect(geometryProblems.connectors).toBe(11);

  // Objects, states, and connectors follow the selected step.
  const focusTitle = page.locator(".kit-lwf-focus__title");
  await page.locator(".kit-lwf-panel [data-step-id='teacher']").click();
  await expect(focusTitle).toHaveText("Teacher 提供目标，但它不学习");
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='teacher']")).toHaveAttribute("data-state", "frozen");
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='teacher']")).not.toHaveClass(/is-dimmed/);
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='backbone']")).toHaveClass(/is-dimmed/);
  await expect(page.locator(".kit-lwf-panel [data-diagram-edge='teacher-target']")).toHaveClass(/is-active/);

  await page.locator(".kit-lwf-panel [data-step-id='update']").click();
  await expect(focusTitle).toHaveText("两条梯度汇入同一个更新对象");
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='update']")).toHaveAttribute("data-state", "update");
  await expect(page.locator(".kit-lwf-panel [data-diagram-edge='lnew-update']")).toHaveClass(/is-active/);
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='teacher']")).toHaveClass(/is-dimmed/);

  // The objective figure typesets real formulas, not styled text.
  await expect(page.locator("#lwf-loss .rk-diagram [data-diagram-node='merge']")).toHaveAttribute("data-state", "objective");
  await expect(page.locator("#lwf-loss .rk-diagram [data-diagram-node='params']")).toHaveAttribute("data-state", "update");
  const lossMath = await page.locator("#lwf-loss .rk-diagram [data-diagram-node='lOld'] math").first().evaluate((node) => ({
    display: node.getAttribute("display"),
    subscripts: node.querySelectorAll("msub").length,
    sums: node.querySelectorAll("munderover").length,
    fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
  }));
  expect(lossMath.display).toBe("block");
  expect(lossMath.subscripts).toBeGreaterThanOrEqual(2);
  expect(lossMath.sums).toBe(1);
  expect(lossMath.fontSize).toBeGreaterThanOrEqual(18);
  const mergeFractions = await page.locator("#lwf-loss .rk-diagram [data-diagram-node='merge'] math mfrac").count();
  expect(mergeFractions).toBe(2);

  // Narrow screens reflow the same spec into an ordered, fully labelled list.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".kit-lwf-panel .rk-diagram")).toHaveAttribute("data-diagram-mode", "list");
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='lOld']")).toContainText("输入 ← 旧响应目标 · 旧类输出");
  await expect(page.locator(".kit-lwf-panel [data-diagram-node='update']")).toContainText("更新 Student 参数");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator(".kit-lwf-panel .rk-diagram")).toHaveAttribute("data-diagram-mode", "grid");
});

test("scroll sections synchronize LwF steps and EWC reuses the same system view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "LwF scenario" }).click();
  const system = page.locator(".rk-sticky-system");
  const focusTitle = page.locator(".kit-lwf-focus__title");

  await page.locator("#lwf-loss").scrollIntoViewIfNeeded();
  await expect(system).toHaveAttribute("data-active-step-id", "loss");
  await expect(focusTitle).toHaveText("两次比较各有自己的对象");

  await page.locator(".kit-lwf-panel [data-step-id='teacher']").click();
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await page.waitForTimeout(180);
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await expect(focusTitle).toHaveText("Teacher 提供目标，但它不学习");
  await expect(page.locator(".rk-flow-step[aria-current='step']")).toContainText("Teacher");
  await page.locator("#lwf-loss").evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35, behavior: "instant" }));
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await expect(system).toHaveAttribute("data-active-step-id", "loss", { timeout: 2500 });
  await expect(page.locator(".rk-flow-step[aria-current='step']")).toContainText("Losses");

  await page.locator("#lwf-update .rk-flow-step").filter({ hasText: "Teacher" }).click();
  await expect(system).toHaveAttribute("data-active-step-id", "teacher");
  await expect(focusTitle).toHaveText("Teacher 提供目标，但它不学习");

  await page.getByRole("button", { name: "EWC scenario" }).click();
  await expect(page.getByRole("heading", { name: /哪些参数不该乱动/ })).toBeVisible();
  const ewcPanel = page.locator(".kit-ewc-panel");
  await page.locator("#ewc-task-a").scrollIntoViewIfNeeded();
  await expect(system).toHaveAttribute("data-active-step-id", "old");
  await expect(ewcPanel).toHaveAttribute("data-focus-step", "old");
  await expect(page.locator(".kit-ewc-panel [data-diagram-node='fisher']")).toHaveClass(/is-dimmed/);
  await expect(page.locator("#ewc-task-a .rk-diagram [data-diagram-node='theta']")).toHaveAttribute("data-state", "trainable");
  await expect(page.locator("#ewc-task-a .rk-diagram [data-diagram-node='star']")).toHaveAttribute("data-state", "target");
  await page.locator("#ewc-importance").scrollIntoViewIfNeeded();
  await expect(system).toHaveAttribute("data-active-step-id", "estimate");
  await expect(page.locator(".kit-ewc-panel [data-diagram-node='fisher']")).not.toHaveClass(/is-dimmed/);
  await expect(page.locator("#ewc-importance .rk-bars__row")).toHaveCount(3);
  await page.locator("#ewc-penalty").scrollIntoViewIfNeeded();
  await expect(system).toHaveAttribute("data-active-step-id", "penalty");
  await expect(page.locator(".kit-ewc-panel .rk-figure__title")).toHaveText("Form the penalty from stored state");
  await expect(page.locator(".kit-ewc-panel [data-diagram-node='penalty']")).not.toHaveClass(/is-dimmed/);
  await expect(page.locator(".kit-ewc-panel [data-diagram-node='thetaB']")).toHaveClass(/is-dimmed/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#ewc-stored").evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35, behavior: "instant" }));
  await expect(system).toHaveAttribute("data-active-step-id", "store");
  await expect.poll(() => page.locator(".rk-sticky-system__visual").evaluate((node) => getComputedStyle(node).position)).toBe("static");
});

test("sidebar selection and keyboard focus stay separate states", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const active = page.locator(".kit-sidebar__course.is-active");
  await expect(active).toHaveAttribute("aria-current", "page");

  const restState = await active.evaluate((node) => {
    const style = getComputedStyle(node);
    return { borderWidths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth], boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
  });
  expect(new Set(restState.borderWidths)).toEqual(new Set(["1px"]));
  expect(restState.boxShadow).toBe("none");
  expect(restState.outlineStyle).toBe("none");

  // Keyboard focus on the already-selected course must not stack a second heavy border.
  await page.locator(".kit-sidebar__brand").focus();
  await page.keyboard.press("Tab");
  const focusRing = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      focused: element.matches(":focus-visible"),
      classes: element.className,
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      borderWidths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
    };
  });
  expect(focusRing.classes).toContain("kit-sidebar__course");
  expect(focusRing.classes).toContain("is-active");
  expect(focusRing.focused).toBe(true);
  expect(focusRing.outlineStyle).toBe("solid");
  expect(focusRing.outlineWidth).toBe("2px");
  expect(focusRing.outlineOffset).toBe("2px");
  expect(focusRing.boxShadow).toBe("none");
  expect(new Set(focusRing.borderWidths)).toEqual(new Set(["1px"]));
});

test("TermRef shares viewport-safe placement, hover, keyboard, and touch behavior", async ({ page, browser }) => {
  // Fail fast and name the step instead of hanging on a locator that never resolves.
  page.setDefaultTimeout(6000);
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
    mobilePage.setDefaultTimeout(6000);
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
