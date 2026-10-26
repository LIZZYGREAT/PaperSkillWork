import { ParallelModelsExample } from "./examples/NetworkExamples";

export type HeroCandidate = "a" | "b";

export function GalleryOpening({ candidate }: { candidate: HeroCandidate }) {
  if (candidate === "b") {
    return <section id="gallery-opening" className="pg-opening pg-opening--b" data-hero-candidate="b" aria-labelledby="pg-opening-title">
      <header className="pg-opening__wide-heading">
        <div>
          <p className="pg-opening__eyebrow">REUSABLE KIT <i aria-hidden="true" /> COMPOSITION STUDY 02</p>
          <h1 id="pg-opening-title">同一输入，<br />两个独立的响应。</h1>
        </div>
        <p>把两条模型路径放在同一张宽幅图里：输入从上方分流，各自进入一个模型，再在对应输出处结束。</p>
      </header>
      <div className="pg-opening__wide-scene"><ParallelModelsExample density="compact" /></div>
      <ol className="pg-opening__reading-order" aria-label="图形阅读顺序">
        <li><span>01</span><strong>共享输入</strong><small>同一个 x₁</small></li>
        <li><span>02</span><strong>分成两路</strong><small>模型身份各自标明</small></li>
        <li><span>03</span><strong>分别输出</strong><small>响应归属明确</small></li>
      </ol>
      <p className="pg-opening__caveat">这是用于展示部件组合的合成例子。Teacher / Student 名称、层数与冻结角色都属于示意假设，不代表某篇论文的实验结构或训练算法。</p>
    </section>;
  }

  return <section id="gallery-opening" className="pg-opening pg-opening--a" data-hero-candidate="a" aria-labelledby="pg-opening-title">
    <div className="pg-opening__editorial-copy">
      <p className="pg-opening__eyebrow">REUSABLE KIT <i aria-hidden="true" /> MECHANISM, MADE READABLE</p>
      <h1 id="pg-opening-title">一份输入，<br />两条模型路径。</h1>
      <p className="pg-opening__lead">同一个样本分别进入两个模型；沿着每条路径，读到它自己的响应。</p>
      <nav className="pg-opening__links" aria-label="展厅入口">
        <a href="#gallery-mini-network">查看小型网络 <span aria-hidden="true">↗</span></a>
        <a href="#gallery-catalog">按教学问题找资产</a>
      </nav>
    </div>
    <div className="pg-opening__editorial-scene"><ParallelModelsExample density="compact" /></div>
    <p className="pg-opening__caveat">这是用于展示组合方式的合成例子。Teacher / Student 名称、层数与冻结角色都属于示意假设，不代表某篇论文的实验结构或训练算法。</p>
  </section>;
}
