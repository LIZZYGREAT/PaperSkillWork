import { test, expect } from '@playwright/test';

test('one catalogue supports teaching needs, capability names and truthful runnable source', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const catalog = page.locator('#gallery-catalog');
  const search = catalog.getByRole('searchbox');
  await search.fill('神经网络某条连接');
  await expect(catalog.locator('nav button')).toHaveCount(1);
  await catalog.locator('nav button').click();
  await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', 'MiniNetworkGlyph');
  await expect(catalog.locator('[data-asset]')).toContainText('不能替代 CNN');
  await expect(catalog.locator('a')).toHaveAttribute('href', '#gallery-mini-network');
  await catalog.getByText('最小用法（先导入此组件及 kit.css）', { exact: true }).click();
  await expect(catalog.locator('details[open] pre')).toContainText('connectAdjacent');
  await catalog.getByText('查看资产真实源码', { exact: true }).click();
  await expect(catalog.locator('details').filter({ has: page.getByText('查看资产真实源码', { exact: true }) }).locator('pre')).toContainText('const MAX_VISIBLE_NODES');
  await catalog.getByText('必需样式 · foundation/neural-network/mini-network-glyph.css', { exact: true }).click();
  await expect(catalog.locator('details').filter({ has: page.getByText('必需样式 · foundation/neural-network/mini-network-glyph.css', { exact: true }) }).locator('pre')).toContainText('.rk-mini-network');
  await search.fill('输入图像到分类响应');
  await expect(catalog.locator('nav button')).toHaveCount(1);
  await catalog.locator('nav button').click();
  await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', 'useAnimationTimeline');
  await expect(catalog.locator('[data-asset]')).toContainText('不作为论文计算引擎');
  await search.fill('ResponseMeter');
  await catalog.getByRole('button', { name: '按能力', exact: true }).click();
  await catalog.locator('nav button').focus();
  await page.keyboard.press('Enter');
  await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', 'ResponseMeter');
  await expect(catalog.locator('[data-asset]')).toContainText('--select ResponseMeter');
  await search.fill('no-match');
  await expect(catalog.locator('nav')).toContainText('没有匹配资产');
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
