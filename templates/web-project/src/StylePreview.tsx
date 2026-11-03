import { ReferenceProvider, ReferenceButton, Term } from "./shared/core/reference/ReferenceHub";
import type { ReferenceEntry } from "./shared/core/reference/types";
import EditorialFlourish from "./shared/foundation/editorial/EditorialFlourish";

const expression = <math display="block"><mrow><msubsup><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></msubsup><mfrac><msup><mi>x</mi><mn>2</mn></msup><mi>n</mi></mfrac><mo>=</mo><msub><mi>s</mi><mi>n</mi></msub></mrow></math>;
const longExpression = <math display="block"><mrow>{Array.from({length:40},(_,i)=><mrow key={i}><msub><mi>x</mi><mn>{i}</mn></msub><mo>+</mo></mrow>)}<mi>c</mi></mrow></math>;
const entries: ReferenceEntry[] = [
  { id:"notation", name:"符号排版", english:"Notation preview", definition:"仅用于检查字体、行距与参考抽屉的测试文字。", role:"检视基础样式。", confusion:"测试表达式不代表论文结果。", related:["layout"], source:"本地样式测试。", detail:<><div className="equation">{expression}</div><div className="equation">{longExpression}</div>{Array.from({length:16},(_,i)=><p key={i}>长正文测试段落 {i+1}：参考资料在窗口内滚动，数学上下标应清晰可读。</p>)}<div className="reference-table"><table><tbody><tr><th>符号</th><th>说明</th></tr><tr><td>x</td><td>测试变量</td></tr></tbody></table></div></> },
  { id:"layout", name:"阅读布局", definition:"检查相关条目和返回行为。", related:["notation"] },
];
export default function StylePreview() {
  const empty = new URLSearchParams(location.search).has("empty-reference");
  const sourceLink = new URLSearchParams(location.search).has("source-link") ? {href:"https://example.org/reference", label:"测试来源"} : undefined;
  return <ReferenceProvider entries={empty ? [] : entries} sourceLink={sourceLink}>
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#preview-opening" className="site-brand" aria-label="DER 样式预览开头"><span className="brand-mark">DER</span><span>持续学习笔记<small>NEURIPS 2020</small></span></a>
        <nav aria-label="预览章节">
          <a href="#preview-opening"><span>01</span>回放起点</a>
          <a href="#preview-layout"><span>02</span>响应比较</a>
          <a href="#preview-math"><span>03</span>公式排版</a>
        </nav>
        <ReferenceButton term="notation">参考资料</ReferenceButton>
      </div>
    </header>
    <main className="rk-reading rk-editorial-preview">
      <div className="rk-editorial-meta"><span>DARK EXPERIENCE REPLAY</span><span>用有限记忆，保留历史预测</span></div>
      <section className="rk-editorial-opening" id="preview-opening">
        <h1 className="rk-headline rk-headline--paper">旧数据已过去，<mark className="rk-highlight">旧判断如何留下？</mark></h1>
        <p className="rk-lead">从持续学习的真实约束出发，先看有限回放能做什么，再看它还没记录什么。</p>
        <EditorialFlourish />
      </section>
      <section className="rk-section rk-columns" id="preview-layout"><div className="rk-prose"><h2>标题与正文</h2><p>这是一段测试文字。行内 <math><msub><mi>x</mi><mi>i</mi></msub></math> 与正文共享阅读节奏。<Term id="notation">符号排版</Term> 提供悬停解释。</p><p className="rk-caption">语义色示例：<span className="rk-text--positive">可稳定保留</span> · <span className="rk-text--caution">需谨慎解释</span> · <span className="rk-text--negative">已被证据推翻</span></p><ReferenceButton term="notation" /></div><figure><div className="rk-equation">{expression}</div><figcaption className="rk-caption">分数、求和、上下标的本地预览。</figcaption></figure></section>
      <section className="rk-section" id="preview-math"><h3>长表达式</h3><div className="rk-equation">{longExpression}</div><EditorialFlourish end /></section>
    </main>
  </ReferenceProvider>;
}
