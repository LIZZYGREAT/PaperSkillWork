export function openWorkspaceFor(objectId?: string) {
  window.dispatchEvent(new CustomEvent('lwf:open-workspace', { detail: { objectId } }));
}
