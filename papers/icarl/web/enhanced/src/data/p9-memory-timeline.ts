import {
  INCOMING_CLASS_IDS,
  MEMORY_BUDGET,
  NEXT_QUOTA,
  OLD_CLASS_IDS,
  P_AFTER,
  P_BEFORE,
} from "./icarl-runtime";

export type P9MemoryPhase = "trimming" | "slots-freed" | "selecting" | "submitted";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const TRIMMING_END = 0.45;
const SELECTING_START = 0.52;
const SELECTING_END = 0.97;
const CLASS_SELECTION_WINDOW = (SELECTING_END - SELECTING_START) / INCOMING_CLASS_IDS.length;

export function p9MemoryTimelineAt(progress: number) {
  const normalizedProgress = clamp(progress);
  const trimmingProgress = clamp(normalizedProgress / TRIMMING_END);
  const oldClasses = OLD_CLASS_IDS.map((classId, classIndex) => {
    const classProgress = clamp((trimmingProgress - classIndex / OLD_CLASS_IDS.length) * OLD_CLASS_IDS.length);
    const removedCount = P_BEFORE[classId].slice(NEXT_QUOTA).reduce((count, _sample, index) => {
      const sampleProgress = clamp(classProgress * (P_BEFORE[classId].length - NEXT_QUOTA) - index);
      return count + (sampleProgress >= 0.5 ? 1 : 0);
    }, 0);
    return {
      classId,
      trimProgress: classProgress,
      removedCount,
      retainedCount: P_BEFORE[classId].length - removedCount,
    };
  });
  const incomingClasses = INCOMING_CLASS_IDS.map((classId, classIndex) => {
    const selectionProgress = clamp((normalizedProgress - (SELECTING_START + classIndex * CLASS_SELECTION_WINDOW)) / CLASS_SELECTION_WINDOW);
    const selectedCount = P_AFTER[classId].reduce((count, _sample, index) => {
      const sampleProgress = clamp(selectionProgress * P_AFTER[classId].length - index);
      return count + (sampleProgress >= 0.5 ? 1 : 0);
    }, 0);
    return { classId, selectionProgress, selectedCount };
  });
  const oldRetainedCount = oldClasses.reduce((count, item) => count + item.retainedCount, 0);
  const newSelectedCount = incomingClasses.reduce((count, item) => count + item.selectedCount, 0);
  const phase: P9MemoryPhase = normalizedProgress >= 1
    ? "submitted"
    : normalizedProgress >= SELECTING_START
      ? "selecting"
      : normalizedProgress >= TRIMMING_END
        ? "slots-freed"
        : "trimming";

  return {
    progress: normalizedProgress,
    phase,
    oldClasses,
    incomingClasses,
    oldRetainedCount,
    newSelectedCount,
    candidateCount: oldRetainedCount + newSelectedCount,
    freedSlotCount: OLD_CLASS_IDS.reduce((count, classId) => count + P_BEFORE[classId].length - NEXT_QUOTA, 0),
    budget: MEMORY_BUDGET,
  };
}
