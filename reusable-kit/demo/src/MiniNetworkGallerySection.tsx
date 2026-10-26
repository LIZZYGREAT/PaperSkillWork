import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";
import { LocalNetworkExample, ParallelModelsExample } from "./examples/NetworkExamples";
import exampleSource from "../../examples/shared-input-models/NetworkExamples.tsx?raw";
import exampleStyle from "../../examples/shared-input-models/network-examples.css?raw";

export function MiniNetworkGallerySection() {
  return <section id="gallery-mini-network" className="pattern-gallery__section" aria-labelledby="gallery-mini-network-title">
    <SectionHeader index="05" eyebrow="小型网络" title="从内部连接，到两个模型的关系" lead="先沿一条路径查看节点连接，再观察同一输入如何分别进入两个模型。模型身份、输入来源和输出归属放在各自对应的位置。" headingId="gallery-mini-network-title" />
    <LocalNetworkExample />
    <ParallelModelsExample />
    <p className="pg-primitive-boundary">使用边界：小型节点网络适合 Glyph；CNN 特征块、向量 z 和逐类输出头应使用块图组合。冻结或可训练若属于整个模型，就标在模型容器上。</p>
    <GalleryCodePanel title="网络场景 TSX 源码（片段）" code={exampleSource} source="reusable-kit/examples/shared-input-models/NetworkExamples.tsx" level="fragment" notice="与上方实际渲染共用 TSX 源码；单独复制还需要 network-examples.css 和 MiniNetworkGlyph 等小件。" />
    <GalleryCodePanel title="网络场景布局 CSS（独立文件）" code={exampleStyle} source="reusable-kit/examples/shared-input-models/network-examples.css" level="fragment" notice="场景布局样式与 MiniNetworkGlyph 自身样式分开维护。" />
    <GalleryCodePanel title="复制完整场景交付单元" code={'python tools/paper.py scaffold-kit <paper-id> --example shared-input-models --allow-unapproved --dry-run\npython tools/paper.py scaffold-kit <paper-id> --example shared-input-models --allow-unapproved'} source="reusable-kit/examples/shared-input-models/README.md" level="command" notice="这条命令会复制上方真实 TSX/CSS、入口文件、交接 README 及完整 Kit 依赖；按 README 的 import 即可开始组合。" />
  </section>;
}
