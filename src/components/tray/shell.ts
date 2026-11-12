// The outline of a tray and its tab as one path: the tray's top-left corner is the tab's left edge,
// and the tab's right side slants down to the tray's top (the shelf), its bends softened.

export interface ShellGeometry {
  /** Tray size. */
  width: number;
  height: number;
  /** How far the tab rises above the tray. */
  rise: number;
  /** Width of the tab; the whole tray width when the tab merges into it. */
  tabWidth: number;
  /** Radius of the tray's corners, of the corner behind the tab, and of the tab's top corners. */
  radius: number;
  shelfRadius: number;
  tabRadius: number;
  /** Horizontal run of the slant. */
  run: number;
  /** Size of the softened bends at each end of the slant. */
  bend: number;
}

const BEND = 14;
/** A shelf narrower than this reads as a glitch: the tab merges into the tray's side instead. */
const MIN_SHELF = 24;

/** Measures a laid-out tray and its tab. */
export function measureShell(tray: HTMLElement, tab: HTMLElement): ShellGeometry {
  const trayRect = tray.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  const width = trayRect.width;
  const radius = Number.parseFloat(getComputedStyle(tray).borderTopRightRadius);
  const rise = trayRect.top - tabRect.top - 1;
  const run = rise * 0.5;
  const tabRight = Math.min(tabRect.right - trayRect.left, width);
  const shelf = width - tabRight;
  const merged = shelf < run / 2 + BEND + MIN_SHELF;

  return {
    width,
    height: trayRect.height,
    rise,
    tabWidth: merged ? width : tabRight,
    radius,
    shelfRadius: Math.min(radius, shelf - run / 2 - BEND),
    tabRadius: Number.parseFloat(getComputedStyle(tab).borderTopLeftRadius),
    run,
    bend: BEND,
  };
}

/** The outline, inset by `inset` px (half the stroke, for the line), in the shell's own frame. */
export function shellPath(g: ShellGeometry, inset = 0): string {
  const i = inset;
  const arc = (r: number, x: number, y: number) =>
    `A${Math.max(0, r)} ${Math.max(0, r)} 0 0 1 ${x} ${y}`;
  const bottom = g.height + g.rise;

  let side = `H${g.tabWidth - g.tabRadius}${arc(g.tabRadius - i, g.tabWidth - i, g.tabRadius)}`;
  if (g.tabWidth < g.width - 0.5) {
    const x0 = g.tabWidth - g.run / 2;
    const x1 = g.tabWidth + g.run / 2;
    const length = Math.hypot(g.run, g.rise);
    const u = g.run / length;
    const v = g.rise / length;
    const c = g.bend;
    side =
      `H${x0 - c}Q${x0} ${i} ${x0 + c * u} ${i + c * v}` +
      `L${x1 - c * u} ${g.rise + i - c * v}Q${x1} ${g.rise + i} ${x1 + c} ${g.rise + i}` +
      `H${g.width - g.shelfRadius}${arc(g.shelfRadius - i, g.width - i, g.rise + g.shelfRadius)}`;
  }

  return (
    `M${i} ${bottom - g.radius}V${g.tabRadius}${arc(g.tabRadius - i, g.tabRadius, i)}${side}` +
    `V${bottom - g.radius}${arc(g.radius - i, g.width - g.radius, bottom - i)}` +
    `H${g.radius}${arc(g.radius - i, i, bottom - g.radius)}Z`
  );
}
