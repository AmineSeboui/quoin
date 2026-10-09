/** 44px is the platform minimum for a finger. It is applied as a floor rather than
 *  a height so a control keeps its own pointer-precise size, and only where the
 *  primary pointer is coarse so mouse-driven layouts keep their density. */
export const TAP_TARGET_FLOOR = 'pointer-coarse:min-h-11';

/** The tap target floor applied to both axes, for square icon controls. */
export const SQUARE_TAP_TARGET_FLOOR = `${TAP_TARGET_FLOOR} pointer-coarse:min-w-11`;

/** For an icon control pinned to a corner, where growing the box would drag the icon
 *  inward. The target is a centred, transparent pseudo-element instead, so the hit
 *  area reaches 44px while the icon keeps its own size and position. Requires the
 *  control to be positioned, which a pinned one already is. */
export const ICON_TAP_TARGET_FLOOR = [
  "pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2",
  'pointer-coarse:before:size-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2',
  "pointer-coarse:before:content-['']",
].join(' ');
