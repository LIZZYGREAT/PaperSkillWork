import { useState } from 'react';
import type { ResearchTopicTag } from '../data/research-topics';

export function TopicTags({ tags }: { tags: ResearchTopicTag[] }) {
  const [openTag, setOpenTag] = useState<string | null>(null);

  return (
    <div className="paper-topic-tags" role="group" aria-label="论文研究定位">
      {tags.map((tag) => {
        const tooltipId = `lwf-topic-${tag.id}-tooltip`;
        const isOpen = openTag === tag.id;
        return (
          <button
            key={tag.id}
            type="button"
            className="paper-topic-chip"
            aria-describedby={tooltipId}
            aria-expanded={isOpen}
            onClick={() => setOpenTag(isOpen ? null : tag.id)}
            onBlur={() => setOpenTag(null)}
          >
            <span className="paper-topic-category">{tag.category}</span>
            <span>{tag.label}</span>
            <span id={tooltipId} className="paper-topic-tooltip" role="tooltip">{tag.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
