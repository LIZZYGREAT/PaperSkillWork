import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { GalleryCodePanel } from "./GalleryCodePanel";
import { ForwardTimelineExample } from "./examples/ForwardTimelineExample";
import exampleSource from "./examples/ForwardTimelineExample.tsx?raw";

export function TimelineGallerySection() {
  return <section id="gallery-timeline" className="pattern-gallery__section" aria-labelledby="gallery-timeline-title">
    <SectionHeader index="06" eyebrow="同步时间线" title="沿同一样本，逐步看清前向过程" lead="导航、图形、当前说明和公式由同一个时钟推进。可以播放完整路径，也可以选择某个阶段，停下来核对输入与输出。" headingId="gallery-timeline-title" />
    <ForwardTimelineExample />
    <GalleryCodePanel title="展开可运行的时间线示例 · useAnimationTimeline" code={exampleSource.split("../../../foundation/").join("./shared/foundation/")} source="recipes/animation-timeline.md" level="runnable" notice="与主舞台共用一份 TSX，通过一次 useAnimationTimeline 调用同步图形与文字；布局样式见 Recipe。" />
  </section>;
}
