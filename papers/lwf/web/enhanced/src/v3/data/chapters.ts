export const LWF_CHAPTERS = [
  { id: "00", slug: "problem", title: "问题设定", status: "ready" },
  { id: "01", slug: "architecture", title: "模型结构", status: "ready" },
  { id: "02", slug: "key-move", title: "关键做法", status: "ready" },
  { id: "03", slug: "training-cycle", title: "一次训练", status: "ready" },
  { id: "04", slug: "mechanism-boundary", title: "机制与边界", status: "planned" },
  { id: "05", slug: "sequential", title: "连续任务", status: "planned" },
  { id: "06", slug: "evidence", title: "论文证据", status: "planned" },
  { id: "07", slug: "replay", title: "完整回放", status: "planned" },
] as const;

export type LwfChapter = (typeof LWF_CHAPTERS)[number];
export type LwfChapterId = LwfChapter["id"];

// 00–03 are a reviewable vertical slice. The upstream tutorial stays blocked
// until all eight mapped chapters contain real content and modules.
export const LWF_UPSTREAM_MAPPING = {
  chapterCount: LWF_CHAPTERS.length,
  readyChapterCount: LWF_CHAPTERS.filter((chapter) => chapter.status === "ready").length,
  upstreamReady: false,
} as const;

export function getLwfChapter(id: string): LwfChapter | undefined {
  return LWF_CHAPTERS.find((chapter) => chapter.id === id);
}
