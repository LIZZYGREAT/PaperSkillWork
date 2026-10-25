import { test, expect } from '@playwright/test';

test('signed values, explicit scales and responsive default parts', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const shelf = page.locator('#gallery-parts');
  expect(await shelf.locator('.rk-vector-coordinate').evaluateAll(nodes => nodes.map(n => Number(n.dataset.value)))).toEqual([1, .5, -1]);
  const meter = shelf.locator('meter');
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

test('independent retrieval composition derives every score and the winner from one query', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const root = page.locator('[data-retrieval-query]');
  for (const expected of [[2, -.5], [-1, 1.5]]) {
    expect(await root.locator('[data-score]').evaluateAll(nodes => nodes.map(n => Number(n.dataset.score)))).toEqual(expected);
    expect(await root.locator('meter').evaluateAll(nodes => nodes.map(n => n.value))).toEqual(expected);
    await expect(root.locator('p[role="status"]')).toContainText(expected[0] > expected[1] ? '候选 a' : '候选 b');
    await root.getByRole('button').click();
  }
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await root.evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true);
});
