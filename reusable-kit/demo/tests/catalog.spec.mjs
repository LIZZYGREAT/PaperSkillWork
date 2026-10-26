import { layoutWidths } from "./qa-scope.mjs";
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
  await catalog.getByText('最小用法（先导入 kit.css）', { exact: true }).click();
  await expect(catalog.locator('details[open] pre')).toContainText('connectAdjacent');
  await catalog.getByText('查看资产真实源码', { exact: true }).click();
  await expect(catalog.locator('details').filter({ has: page.getByText('查看资产真实源码', { exact: true }) }).locator('pre')).toContainText('const MAX_VISIBLE_NODES');
  await catalog.getByText('必需样式 · foundation/neural-network/mini-network-glyph.css', { exact: true }).click();
  await expect(catalog.locator('details').filter({ has: page.getByText('必需样式 · foundation/neural-network/mini-network-glyph.css', { exact: true }) }).locator('pre')).toContainText('.rk-mini-network');
  await expect(catalog.locator('.asset-catalog__preview [data-network-example="local"]')).toBeVisible();
  await search.fill('输入图像到分类响应');
  await catalog.locator('nav button[data-asset-name="useAnimationTimeline"]').click();
  await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', 'useAnimationTimeline');
  await expect(catalog.locator('[data-asset]')).toContainText('不作为论文计算引擎');
  await search.fill('ResponseMeter');
  await expect(catalog.locator('nav button')).toHaveCount(0);
  await expect(catalog.locator('[data-asset]')).toHaveCount(0);
  await catalog.getByRole('button', { name: '按能力', exact: true }).click();
  await expect(catalog.locator('nav button')).toHaveCount(1);
  await catalog.locator('nav button').focus();
  await page.keyboard.press('Enter');
  await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', 'ResponseMeter');
  await expect(catalog.locator('[data-asset]')).toContainText('--select ResponseMeter');
  await search.fill('no-match');
  await expect(catalog.locator('nav')).toContainText('没有匹配资产');
  await expect(catalog.locator('[data-asset]')).toHaveCount(0);
  await search.fill('');
  await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', 'ResponseMeter');
  await catalog.locator('.asset-catalog__registry > summary').click();
  await expect(catalog.locator('.asset-catalog__registry')).toContainText('当前未进入精选交互目录');
  for (const width of layoutWidths) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('teaching search indexes relationships, intermediate values and validated synonyms', async ({ page }) => {
  await page.goto('/?demo=gallery');
  const catalog = page.locator('#gallery-catalog');
  const search = catalog.getByRole('searchbox');
  const cases = [
    ['网络局部连接', 'MiniNetworkGlyph'],
    ['冻结与训练模型', 'SemanticMark'],
    ['样本到特征表示', 'FeatureBlocks'],
    ['向量得分', 'RepresentationVector'],
    ['滚动同步', 'StickySystemView'],
    ['梯度关系', 'DiagramFlow'],
  ];
  for (const [query, expected] of cases) {
    await search.fill(query);
    await expect(catalog.locator('nav button')).not.toHaveCount(0);
    const candidate = catalog.locator(`nav button[data-asset-name="${expected}"]`);
    await expect(candidate).toBeVisible();
    await candidate.click();
    await expect(catalog.locator('[data-asset]')).toHaveAttribute('data-asset', expected);
  }
  await search.fill('a mechanism with no matching asset');
  await expect(catalog.locator('nav')).toContainText('没有匹配资产');
  await expect(catalog.locator('[data-asset]')).toHaveCount(0);
});

test('catalog preview uses a data edge from representation to score', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?demo=gallery');
  const catalog = page.locator('#gallery-catalog');
  await catalog.getByRole('searchbox').fill('梯度关系');
  await catalog.locator('nav button[data-asset-name="DiagramFlow"]').click();
  const scoringEdge = catalog.locator('.asset-catalog__preview [data-diagram-edge="representation-to-score"]');
  await expect(scoringEdge).toHaveClass(/is-data/);
  await expect(scoringEdge).not.toHaveClass(/is-gradient/);
});
