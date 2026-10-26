import { useState } from 'react';
import registry from 'virtual:kit-registry';
import { GalleryCodePanel } from './GalleryCodePanel';
import { AssetCatalogPreview } from './AssetCatalogPreview';
import './asset-catalog.css';

type TeachingSearch = { inputs?: string[]; outputs?: string[]; relations?: string[]; mechanisms?: string[]; keywords?: string[] };
type CatalogAsset = {
  status: string;
  category: string;
  path: string;
  source: string;
  dependencies: string[];
  catalog?: string;
  purpose?: string;
  capabilities?: string[];
  teaching?: TeachingSearch;
  use_when?: string;
  avoid_when?: string;
  demo_anchor?: string;
  recipe?: string;
  usage?: string;
};

const registryAssets = registry as Record<string, CatalogAsset>;
const sources = import.meta.glob(['../../foundation/**/*.{tsx,ts,css}', '../../optional/formula/FormulaBlock.tsx'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const examples = import.meta.glob('./examples/*.{tsx,css}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const deliveryFiles = import.meta.glob('../../examples/**/*.{tsx,ts,css,md}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const recipes = import.meta.glob('../../recipes/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const allEntries = Object.entries(registryAssets);
const entries = allEntries.filter(([, asset]) => asset.catalog === 'featured');
const referenceEntries = allEntries.filter(([, asset]) => asset.catalog !== 'featured');

function searchFields(name: string, asset: CatalogAsset, mode: 'capability' | 'need') {
  if (mode === 'capability') {
    return [name, asset.category, asset.path, ...(asset.capabilities ?? [])];
  }
  return [asset.purpose, asset.use_when, asset.avoid_when, ...(asset.teaching?.inputs ?? []), ...(asset.teaching?.outputs ?? []), ...(asset.teaching?.relations ?? []), ...(asset.teaching?.mechanisms ?? []), ...(asset.teaching?.keywords ?? [])].filter((value): value is string => Boolean(value));
}

function matchingEntries(query: string, mode: 'capability' | 'need') {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return entries;
  return entries
    .map(([name, asset], index) => {
      const fields = searchFields(name, asset, mode).map(value => value.toLocaleLowerCase());
      const score = fields.reduce((total, field) => total + (field === normalized ? 4 : field.startsWith(normalized) ? 2 : field.includes(normalized) ? 1 : 0), 0);
      return { entry: [name, asset] as [string, CatalogAsset], index, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ entry }) => entry);
}

export function AssetCatalog() {
  const [mode, setMode] = useState<'capability' | 'need'>('need');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('MiniNetworkGlyph');
  const filtered = matchingEntries(query, mode);
  const selectedIsReference = referenceEntries.some(([name]) => name === selected);
  const activeName = filtered.some(([name]) => name === selected)
    ? selected
    : !query.trim() && selectedIsReference
      ? selected
      : filtered[0]?.[0] ?? null;
  const asset = activeName ? registryAssets[activeName] : null;
  const deliveryId = activeName === 'MiniNetworkGlyph' ? 'shared-input-models' : ['SampleToken', 'RepresentationVector', 'ResponseMeter'].includes(activeName ?? '') ? 'vector-retrieval' : null;
  const deliveryTsxPath = deliveryId === 'shared-input-models' ? '../../examples/shared-input-models/NetworkExamples.tsx' : deliveryId === 'vector-retrieval' ? '../../examples/vector-retrieval/RetrievalExample.tsx' : null;
  const deliveryCssPath = deliveryId === 'shared-input-models' ? '../../examples/shared-input-models/network-examples.css' : deliveryId === 'vector-retrieval' ? '../../examples/vector-retrieval/retrieval-example.css' : null;
  const file = activeName === 'MiniNetworkGlyph' ? 'NetworkExamples' : activeName === 'useAnimationTimeline' ? 'ForwardTimelineExample' : asset?.category === 'visual-part' ? 'PartsSpecimen' : null;
  const cssFile = file === 'NetworkExamples' ? 'network-examples' : file === 'ForwardTimelineExample' ? 'forward-timeline-example' : 'parts-specimen';
  const exampleSource = deliveryTsxPath ? deliveryFiles[deliveryTsxPath] : file ? examples[`./examples/${file}.tsx`] : undefined;
  const exampleSourcePath = deliveryId === 'shared-input-models' ? 'reusable-kit/examples/shared-input-models/NetworkExamples.tsx' : deliveryId === 'vector-retrieval' ? 'reusable-kit/examples/vector-retrieval/RetrievalExample.tsx' : file ? `demo/src/examples/${file}.tsx` : '';
  const exampleCss = deliveryCssPath ? deliveryFiles[deliveryCssPath] : file ? examples[`./examples/${cssFile}.css`] : undefined;
  const exampleCssPath = deliveryId === 'shared-input-models' ? 'reusable-kit/examples/shared-input-models/network-examples.css' : deliveryId === 'vector-retrieval' ? 'reusable-kit/examples/vector-retrieval/retrieval-example.css' : file ? `demo/src/examples/${cssFile}.css` : '';
  const source = asset?.source ? sources[`../../${asset.source}`] : undefined;
  const stylesheetPaths = asset ? [...new Set([
    ...asset.dependencies.filter(path => path.endsWith('.css')),
    ...Array.from((source ?? '').matchAll(/import\s+["'](\.[^"']+\.css)["']/g), match => new URL(match[1], `https://kit.invalid/${asset.source}`).pathname.slice(1)),
  ])] : [];
  const recipeSource = asset?.recipe ? recipes[`../../${asset.recipe}`] : undefined;

  return <section id="gallery-catalog" className="asset-catalog" aria-labelledby="catalog-title">
    <header><h2 className="rk-type--heading-2" id="catalog-title">现在，需要解释什么？</h2><p className="rk-caption">按能力查部件，或按教学任务找关系。精选目录和完整 Registry 都来自同一份 registry.yaml。</p></header>
    <div className="asset-catalog__tools">
      <div role="group" aria-label="发现方式"><button type="button" aria-pressed={mode === 'need'} onClick={() => setMode('need')}>按教学需求</button><button type="button" aria-pressed={mode === 'capability'} onClick={() => setMode('capability')}>按能力</button></div>
      <label>查找精选资产<input type="search" placeholder="网络连接、冻结模型、样本到向量…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <small>{mode === 'need' ? '索引用途、输入输出、关系、机制和验证过的同义词' : '索引资产名、类别、源码路径和绘制职责'}</small>
    </div>
    <div className="asset-catalog__body">
      <div className="asset-catalog__directory">
        <nav aria-label="匹配的精选视觉资产">{filtered.map(([name, item]) => <button type="button" key={name} data-asset-name={name} aria-current={activeName === name ? 'true' : undefined} onClick={() => setSelected(name)}><strong>{mode === 'need' ? item.purpose ?? name : name}</strong><small>{mode === 'need' ? `${item.category} · ${item.source}` : (item.capabilities ?? []).join(' · ')}</small></button>)}{!filtered.length && <p role="status">没有匹配资产。可以独立实现场景，也可以缩短关键词。</p>}</nav>
        <details className="asset-catalog__registry"><summary>查看其余 {referenceEntries.length} 个 Registry 条目</summary><p>这些条目仍在 Registry 中维护，当前未进入精选交互目录。条目名、源码位置和 Recipe 路径均来自 registry.yaml。</p><ul>{referenceEntries.map(([name, item]) => {
          const listedRecipe = item.recipe ? recipes[`../../${item.recipe}`] : undefined;
          return <li key={name}><strong>{name}</strong><span>{item.category} · <code>{item.source}</code></span>{item.recipe && <details><summary>Recipe · {item.recipe}</summary>{listedRecipe ? <pre>{listedRecipe}</pre> : <code>{item.recipe}</code>}</details>}<button type="button" onClick={() => { setQuery(''); setSelected(name); }}>查看 Registry 详情</button></li>;
        })}</ul><p><code>scaffold-kit --select AssetName</code> 可按具体条目复制源码闭包。</p></details>
      </div>
      {activeName && asset ? <article className="asset-catalog__detail" data-asset={activeName}>
        <p className="rk-caption">{asset.catalog === 'featured' ? '精选资产' : 'Registry 参考条目'} · {asset.category} / {asset.status}</p><h3>{activeName}</h3>
        {asset.catalog === 'featured' ? <>
          <section className="asset-catalog__preview" aria-label={`${activeName} 的实际组件预览`}><div className="asset-catalog__preview-heading"><strong>实际组件预览</strong><span>合成演示数据 · 可操作控件会直接更新</span></div><AssetCatalogPreview name={activeName} />{asset.demo_anchor && <p className="asset-catalog__preview-link"><a href={`#${asset.demo_anchor}`}>查看完整展厅场景 ↗</a></p>}</section>
          <dl><dt>适用</dt><dd>{asset.use_when}</dd><dt>不要用于</dt><dd>{asset.avoid_when}</dd><dt>源码</dt><dd><code>reusable-kit/{asset.source}</code></dd><dt>依赖</dt><dd>{asset.dependencies.join(', ')}；同目录导入的 CSS、类型和 Hook 由复制器递归包含。</dd><dt>Recipe</dt><dd>{asset.recipe ? <code>{asset.recipe}</code> : '未登记'}</dd></dl>
          <pre><code>{`python tools/paper.py scaffold-kit <paper-id> --select ${activeName} --allow-unapproved --dry-run`}</code></pre>
          {asset.usage && <GalleryCodePanel title="最小用法（先导入 kit.css）" code={`import './shared/foundation/styles/kit.css';\nimport { ${activeName} } from './shared/${asset.source.replace(/\.tsx?$/, '')}';\n\nexport function Example() { return ${asset.usage}; }`} source={asset.source} level="runnable" notice="将 Example 挂载到 React 页面；上方 dry-run 会显示真实发布源码与目标目录。复制命令包含所需样式和本地依赖。" />}
          {source && <GalleryCodePanel title="查看资产真实源码" code={source} source={asset.source} level="fragment" notice="资产真实源码；导入的样式和类型必须一起复制。" />}
          {stylesheetPaths.map(path => sources[`../../${path}`] && <GalleryCodePanel key={path} title={`必需样式 · ${path}`} code={sources[`../../${path}`]} source={path} level="fragment" notice="真实资产样式；复制器自动包含。入口需导入 kit.css，组件导入自身 CSS。" />)}
          {exampleSource && <GalleryCodePanel title="场景 TSX 源码（片段）" code={deliveryId ? exampleSource : exampleSource.split('../../../foundation/').join('./shared/foundation/')} source={exampleSourcePath} level="fragment" notice="这份源码由 Gallery 实际运行。单独复制 TSX 需要配套 CSS 和其它小件；完整组合请使用下方场景交付命令。" />}
          {exampleCss && <GalleryCodePanel title="场景布局 CSS（独立文件）" code={exampleCss} source={exampleCssPath} level="fragment" notice="这是场景自己的布局 CSS；组件资产 CSS 由 Kit 依赖闭包另行复制。" />}
          {deliveryId && <GalleryCodePanel title={`复制完整场景包 · ${deliveryId}`} code={`python tools/paper.py scaffold-kit <paper-id> --example ${deliveryId} --allow-unapproved --dry-run\npython tools/paper.py scaffold-kit <paper-id> --example ${deliveryId} --allow-unapproved`} source={`reusable-kit/examples/${deliveryId}/README.md`} level="command" notice="命令会一起复制该包的真实 TSX、CSS、README 与 manifest 中的 Kit 小件依赖；可直接按 README 中的入口 import 使用。" />}
          {recipeSource && <details className="asset-catalog__recipe"><summary>查看完整 Recipe · {asset.recipe}</summary><pre>{recipeSource}</pre></details>}
        </> : <>
          <p className="asset-catalog__reference-note">该资产仍可按 Registry 名称直接查阅与复制，但尚未纳入精选交互目录。</p><dl><dt>源码</dt><dd><code>reusable-kit/{asset.source}</code></dd><dt>类别</dt><dd>{asset.category}</dd><dt>依赖</dt><dd>{asset.dependencies.join(', ') || '无额外依赖'}</dd><dt>Recipe</dt><dd>{asset.recipe ? <code>{asset.recipe}</code> : '未登记'}</dd></dl>
          <pre><code>{`python tools/paper.py scaffold-kit <paper-id> --select ${activeName} --allow-unapproved --dry-run`}</code></pre>
          {recipeSource && <details className="asset-catalog__recipe" open><summary>查看 Registry Recipe · {asset.recipe}</summary><pre>{recipeSource}</pre></details>}
        </>}
      </article> : <div className="asset-catalog__empty" role="status"><p>没有与当前查询匹配的精选资产。</p><p>完整 Registry 仍可在左侧目录中展开查看，独立实现也是合理选择。</p></div>}
    </div>
  </section>;
}
