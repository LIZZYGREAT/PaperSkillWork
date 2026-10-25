import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";
import { ForwardTimelineExample } from "./examples/ForwardTimelineExample";
import exampleSource from "./examples/ForwardTimelineExample.tsx?raw";

export function TimelineGallerySection() {
  return <section id="gallery-timeline" className="pattern-gallery__section" aria-labelledby="gallery-timeline-title">
    <SectionHeader index="06" eyebrow="FOUNDATION / TIMELINE" title="一个时钟，让整块教学画面同步推进" lead="导航、完整路径、当前说明、公式和输出都从同一份 timeline.state 推导。点击任一阶段，可暂停核对同一样本的前向过程。" headingId="gallery-timeline-title" />
    <ForwardTimelineExample />
    <GalleryCodePanel title="Open runnable timeline example" code={exampleSource.replace("../../../foundation/", "./shared/foundation/")} source="recipes/animation-timeline.md" level="runnable" notice="与主舞台共用一份编译过的 TSX；只创建一次 Hook。流水线跨领域复用另由受控时钟 fixture 验证。" />
  </section>;
}
