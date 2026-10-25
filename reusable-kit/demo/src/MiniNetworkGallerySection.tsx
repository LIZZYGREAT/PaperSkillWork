import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";
import { LocalNetworkExample, ParallelModelsExample } from "./examples/NetworkExamples";
import exampleSource from "./examples/NetworkExamples.tsx?raw";

export function MiniNetworkGallerySection() {
  return <section id="gallery-mini-network" className="pattern-gallery__section" aria-labelledby="gallery-mini-network-title">
    <SectionHeader index="05" eyebrow="小型网络" title="从内部连接，到两个模型的关系" lead="先沿一条路径查看节点连接，再观察同一输入如何分别进入两个模型。模型身份、输入来源和输出归属放在各自对应的位置。" headingId="gallery-mini-network-title" />
    <LocalNetworkExample />
    <ParallelModelsExample />
    <p className="pg-primitive-boundary">使用边界：小型节点网络适合 Glyph；CNN 特征块、向量 z 和逐类输出头应使用块图组合。冻结或可训练若属于整个模型，就标在模型容器上。</p>
    <GalleryCodePanel title="展开可运行的网络示例 · MiniNetworkGlyph" code={exampleSource.split("../../../foundation/").join("./shared/foundation/")} source="recipes/mini-network-glyph.md" level="runnable" notice="与上方实际渲染共用 TSX 源码。复制后渲染 LocalNetworkExample / ParallelModelsExample；布局样式见 Recipe。" />
  </section>;
}
