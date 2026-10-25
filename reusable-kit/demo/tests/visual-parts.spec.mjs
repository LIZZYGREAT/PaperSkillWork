import { test, expect } from '@playwright/test';

test('response labels share one line and parallel output symbols stay upright and level', async ({ page }) => {
  await page.goto('/?demo=gallery');
  for (const [selector, text] of [['scores', '尺度：-2 至 2'], ['responses', '尺度：0 至 1']]) {
    const group = page.locator(`.pg-forward-object--${selector}`);
    await expect(group.locator('.pg-output-heading small')).toHaveText(text);
    await expect(group.locator('.rk-response-meter small')).toHaveCount(0);
  }
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const row of await page.locator('.pg-head-response').all()) {
      const offset = await row.evaluate(el => {
        const a = el.querySelector('.pg-sigmoid-mark').getBoundingClientRect();
        const b = el.querySelector('label').getBoundingClientRect();
        return Math.abs(a.y + a.height / 2 - b.y - b.height / 2);
      });
      expect(offset).toBeLessThan(1);
    }
    const symbols = page.locator('.pg-model-symbol');
    await expect(symbols).toHaveText(['t(x1)', 's(x1)']);
    const inputSymbol = page.locator('.pg-model-path > .rk-flow-connector .rk-diagram-symbol').first();
    for (const symbol of await symbols.all()) {
      await expect(symbol).toHaveCSS('font-style', 'normal');
      await expect(symbol).toHaveCSS('font-size', await inputSymbol.evaluate(el => getComputedStyle(el).fontSize));
      await expect(symbol).toHaveCSS('font-family', await inputSymbol.evaluate(el => getComputedStyle(el).fontFamily));
    }
    for (const output of await page.locator('.pg-model-output').all()) {
      await expect(output.locator('.rk-flow-connector')).toHaveAttribute('data-direction', 'down');
      expect(await output.evaluate(el => {
        const arrow = el.querySelector('svg').getBoundingClientRect();
        const label = el.querySelector('.rk-flow-connector__label').getBoundingClientRect();
        const formula = el.querySelector('.pg-model-symbol').getBoundingClientRect();
        return arrow.bottom < label.top && label.bottom <= formula.top;
      })).toBe(true);
    }
    if (width > 700) {
      const tops = await symbols.evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().y));
      expect(Math.abs(tops[0] - tops[1])).toBeLessThan(1);
    }
  }
});

test('signed values, explicit scales and responsive default parts', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const shelf = page.locator('#gallery-parts');
  expect(await shelf.locator('.rk-vector-coordinate').evaluateAll(nodes => nodes.map(n => Number(n.dataset.value)))).toEqual([1, .5, -1]);
  const meter = shelf.locator('meter');
  await expect(shelf.locator('.rk-response-meter small')).toHaveText('尺度：-4 至 4');
  await expect(meter).toHaveAttribute('min', '-4');
  await expect(meter).toHaveAttribute('max', '4');
  await expect(meter).toHaveAttribute('value', '-1.5');
  await shelf.getByRole('slider', { name: '改变原始得分' }).fill('3');
  await expect(meter).toHaveAttribute('value', '3');
  await expect(shelf.locator('output')).toHaveText('3');
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await shelf.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const glyph of await page.locator('#gallery-specimen .rk-mini-network, #gallery-parts .parts-specimen__network .rk-mini-network').all()) {
      expect(await glyph.evaluate(g => [...g.querySelectorAll('[data-network-label]')].every(label => {
        const circle = g.querySelector(`[data-network-layer="${label.dataset.networkLabel}"] circle`);
        const a = circle.getBoundingClientRect(), b = label.getBoundingClientRect();
        return Math.abs(a.x + a.width / 2 - b.x - b.width / 2) < 3;
      }))).toBe(true);
    }
  }
  await expect(shelf.locator('.rk-flow-connector')).toHaveCount(4);
  await shelf.locator('summary').click();
  await expect(shelf.locator('[data-density="inspect"] [data-network-edge]')).toHaveCount(30);
  await expect(shelf.locator('[data-density="inspect"]')).toBeVisible();
  await expect(shelf.locator('.rk-semantic-mark[data-state="frozen"]')).toContainText('冻结');
});

test('raw score bars preserve zero, sign and magnitude on a shared scale', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const scores = page.locator('.pg-class-scores');
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const rows = await scores.locator('.rk-response-meter').evaluateAll(nodes => nodes.map(el => {
      const track = el.querySelector('.rk-response-meter__track').getBoundingClientRect();
      const fill = el.querySelector('.rk-response-meter__fill').getBoundingClientRect();
      const zero = el.querySelector('.rk-response-meter__zero').getBoundingClientRect();
      const meter = el.querySelector('meter');
      return { value: meter.value, min: meter.min, max: meter.max, extent: fill.width / track.width,
        start: fill.x - zero.x, end: fill.right - zero.x };
    }));
    expect(rows.map(n => n.value)).toEqual([2, 0, -1]);
    for (const row of rows) {
      expect([row.min, row.max]).toEqual([-2, 2]);
      expect(row.extent).toBeCloseTo(Math.abs(row.value) / 4, 2);
      expect(Math.abs(row.value < 0 ? row.end : row.start)).toBeLessThan(1);
    }
    await expect(scores.getByRole('meter', { name: 'g₁(x₁)' })).toHaveAttribute('value', '2');
    expect(await scores.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});

test('independent retrieval composition derives every score and the winner from one query', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const root = page.locator('[data-retrieval-query]');
  await expect(root.locator('.retrieval-example__scale')).toHaveText('内积尺度：-3 至 3');
  await expect(root.locator('.rk-response-meter small')).toHaveCount(0);
  for (const expected of [[2, -.5], [-1, 1.5]]) {
    expect(await root.locator('[data-score]').evaluateAll(nodes => nodes.map(n => Number(n.dataset.score)))).toEqual(expected);
    expect(await root.locator('meter').evaluateAll(nodes => nodes.map(n => n.value))).toEqual(expected);
    await expect(root.locator('p[role="status"]')).toContainText(expected[0] > expected[1] ? '候选 a' : '候选 b');
    await root.getByRole('button').click();
  }
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await root.evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true);
});
