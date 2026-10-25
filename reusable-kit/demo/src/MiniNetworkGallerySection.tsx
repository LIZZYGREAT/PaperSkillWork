import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";
import { LocalNetworkExample, ParallelModelsExample } from "./examples/NetworkExamples";
import exampleSource from "./examples/NetworkExamples.tsx?raw";

export function MiniNetworkGallerySection() {
  return <section id="gallery-mini-network" className="pattern-gallery__section" aria-labelledby="gallery-mini-network-title">
    <SectionHeader index="05" eyebrow="FOUNDATION / MINI NETWORK" title="一个小网络原语，两种正确的使用方式" lead="先看一个网络中的连接，再把两个网络放入共享输入的外层关系中。拓扑属于 Glyph，模型之间的关系属于调用者。" headingId="gallery-mini-network-title" />
    <LocalNetworkExample />
    <ParallelModelsExample />
    <p className="pg-primitive-boundary">使用边界：小型节点网络适合 Glyph；CNN 特征块、向量 z 和逐类输出头应使用块图组合。冻结或可训练若属于整个模型，就标在模型容器上。</p>
    <GalleryCodePanel title="Open runnable MiniNetworkGlyph example" code={exampleSource.replace("../../../foundation/", "./shared/foundation/")} source="recipes/mini-network-glyph.md" level="runnable" notice="与上方实际渲染共用 TSX 源码。复制后渲染 LocalNetworkExample / ParallelModelsExample；布局样式见 Recipe。" />
  </section>;
}
