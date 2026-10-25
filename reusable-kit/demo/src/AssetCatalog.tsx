import { useState } from 'react';
import registry from 'virtual:kit-registry';
import { GalleryCodePanel } from './GalleryCodePanel';
import './asset-catalog.css';

const sources = import.meta.glob('../../../{foundation,core,optional,compositions}/**/*.{tsx,ts,css}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const examples = import.meta.glob('./examples/*.{tsx,css}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const entries = Object.entries(registry).filter(([, asset]) => asset.purpose);

export function AssetCatalog() {
  const [mode, setMode] = useState<'capability' | 'need'>('need');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('MiniNetworkGlyph');
  const filtered = entries.filter(([name, a]) => `${name} ${a.category} ${a.purpose} ${a.use_when}`.toLowerCase().includes(query.toLowerCase()));
  const asset = registry[selected];
  const file = selected === 'MiniNetworkGlyph' ? 'NetworkExamples' : selected === 'useAnimationTimeline' ? 'ForwardTimelineExample' : selected === 'EditorialTypography' ? 'VisualSpecimen' : asset.category === 'visual-part' ? 'PartsSpecimen' : null;
  const cssFile = file === 'NetworkExamples' ? 'network-examples' : file === 'ForwardTimelineExample' ? 'forward-timeline-example' : file === 'VisualSpecimen' ? 'visual-specimen' : 'parts-specimen';
  const exampleSource = examples[`./examples/${file}.tsx`];
  const source = sources[`../../../${asset.source}`];
  return <section id="gallery-catalog" className="asset-catalog" aria-labelledby="catalog-title">
    <header><h2 className="rk-type--heading-2" id="catalog-title">现在，需要解释什么？</h2><p className="rk-caption">按教学任务找到资产，或从能力出发。资料直接来自 registry.yaml；全部仍为 candidate。</p></header>
    <div className="asset-catalog__tools"><div role="group" aria-label="发现方式"><button type="button" aria-pressed={mode === 'need'} onClick={() => setMode('need')}>按教学需求</button><button type="button" aria-pressed={mode === 'capability'} onClick={() => setMode('capability')}>按能力</button></div><label>查找资产<input type="search" placeholder="连接、表示、阶段讲解…" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
    <div className="asset-catalog__body"><nav aria-label="匹配的视觉资产">{filtered.map(([name, a]) => <button type="button" key={name} aria-current={selected === name ? 'true' : undefined} onClick={() => setSelected(name)}><strong>{mode === 'need' ? a.purpose : name}</strong><small>{mode === 'need' ? name : a.purpose}</small></button>)}{!filtered.length && <p role="status">没有匹配资产。可独立实现场景，或尝试更短的关键词。</p>}</nav>
      <article className="asset-catalog__detail" data-asset={selected}><p className="rk-caption">{asset.category} / {asset.status}</p><h3>{selected}</h3><dl><dt>适用</dt><dd>{asset.use_when}</dd><dt>不要用于</dt><dd>{asset.avoid_when}</dd><dt>源码</dt><dd><code>reusable-kit/{asset.source}</code></dd><dt>依赖</dt><dd>{asset.dependencies.join(', ')}；同目录导入的 CSS、类型和 Hook 由复制器递归包含。</dd><dt>Recipe</dt><dd><code>{asset.recipe}</code></dd></dl>
        <a href={`#${asset.demo_anchor}`}>查看真实效果与交互 ↗</a><pre><code>{`python tools/paper.py scaffold-kit <paper-id> --select ${selected} --allow-unapproved`}</code></pre>
        {asset.usage && <GalleryCodePanel title="最小用法（先导入此组件及 kit.css）" code={`import './shared/foundation/styles/kit.css';\nimport { ${selected} } from './shared/${asset.source.replace(/\.tsx?$/, '')}';\n\nexport function Example() { return ${asset.usage}; }`} source={asset.source} level="runnable" notice="将 Example 挂载到 React 页面；复制命令包含所需样式与本地依赖。" />}
        {source && <GalleryCodePanel title="查看资产真实源码" code={source} source={asset.source} level="fragment" notice="资产源码；导入的样式和类型必须一起复制。" />}
        {exampleSource && <GalleryCodePanel title="完整组合示例 · 同一份运行源码" code={exampleSource.split('../../../foundation/').join('./shared/foundation/')} source={`demo/src/examples/${file}.tsx`} level="runnable" notice={`保存为 ${file}.tsx，配套 ${cssFile}.css；此组合需要源码内列出的所有小件，而非只选当前一个资产。`} />}
        {examples[`./examples/${cssFile}.css`] && <GalleryCodePanel title="组合布局 CSS（与图元样式分开）" code={examples[`./examples/${cssFile}.css`]} source={`demo/src/examples/${cssFile}.css`} level="fragment" notice="保存到组合 TSX 导入的同名 CSS；不需要 Gallery 页面样式。" />}
      </article></div>
  </section>;
}
