import { ReferenceHub } from "../../core/reference";
import type { KnowledgeEntry } from "../../core/reference";
import { Drawer } from "../../foundation/overlay/Drawer";

/** Reading-sized Reference Hub drawer shared by every scenario page. */
export function KnowledgeDrawer({ entries, open, selectedId, onSelectedIdChange, onClose }: {
  entries: KnowledgeEntry[];
  open: boolean;
  selectedId: string | null;
  onSelectedIdChange: (entryId: string | null) => void;
  onClose: () => void;
}) {
  const jumpToSection = (sectionId: string) => {
    onClose();
    window.requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ block: "center" }));
  };
  return <Drawer open={open} title="Reference Hub" size="reading" onClose={onClose}><ReferenceHub entries={entries} title="Knowledge entries" selectedId={selectedId} onSelectedIdChange={onSelectedIdChange} onJumpToSection={jumpToSection} /></Drawer>;
}
