export function reorderIndices(
  ids: string[],
  activeId: string,
  overId: string | null,
): { from: number; to: number } | null {
  if (overId === null || activeId === overId) return null;
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1) return null;
  return { from, to };
}
