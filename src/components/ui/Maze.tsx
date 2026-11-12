import { useEffect, useRef, type CSSProperties } from "react";
import type { TextureSettings } from "#app/data/textures";
import { requestTexture } from "#app/lib/reticulate/textures";
import styles from "./Maze.module.css";

/** Where the labyrinth fuses into a patch: a corner of one piece's card, in its units. */
export interface MazeAnchor {
  /** The `MazePiece` whose card it is placed on. */
  at: string;
  corner: readonly [x: number, y: number];
  /** In px. */
  radius: number;
  /** Only while this media query matches, for a corner that lands on text in other layouts. */
  media?: string;
}

const MAZE: TextureSettings = { tile: 280, hard: 6, lumps: 270, color: "#ffffff" };

/** How much bigger a card's patches grow while it is hovered, as sprites' growing patches do. */
const GROW = 1.35;

/** An anchor placed on the grid, in px. */
interface Placed {
  at: string;
  x: number;
  y: number;
  radius: number;
}

/**
 * One labyrinth across a grid of cards, each card showing its own piece in its own colours, so
 * a patch on the corner where cards meet carries on across the gaps. Give the grid the ref and
 * `mazeGrid`, and each card a `MazePiece`. A worker renders it to the grid's size, again after a
 * resize; until then, and on the server, the cards are plain.
 *
 * Hovering or focusing a card that is (or holds) a link grows its patches, on every card they
 * reach, uncovered from each patch's middle out like a sprite's.
 */
export function useMaze(anchors: readonly MazeAnchor[]) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current!;
    let latest = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let size = { width: 0, height: 0, distance: 0 };
    let placed: Placed[] = [];
    let grown = new Map<string, Promise<readonly [string, string]>>();
    let hovered: string | undefined;

    // two masks: the whole patch, painted in the inner tone, and the patch without the
    // labyrinth running through its core, painted over it in the patch's own colour
    const masks = (blobs: Placed[], priority: number) =>
      Promise.all(
        ["#ffffff", "#ffffff00"].map((inner) =>
          requestTexture(
            {
              ...MAZE,
              inner,
              blobs: blobs.map(({ x, y, radius }) => [
                x / size.width,
                y / size.height,
                radius / size.height,
                1,
              ]),
            },
            size.width,
            size.height,
            priority,
          ),
        ),
      ) as Promise<[string, string]>;

    const grownFor = (id: string) => {
      let promise = grown.get(id);
      if (!promise) {
        const blobs = placed.map((anchor) =>
          anchor.at === id ? { ...anchor, radius: anchor.radius * GROW } : anchor,
        );
        promise = masks(blobs, size.distance + 1);
        grown.set(id, promise);
      }
      return promise;
    };

    const paint = async () => {
      const request = ++latest;
      const box = grid.getBoundingClientRect();
      const width = Math.round(box.width);
      const height = Math.round(box.height);
      if (!width || !height) return;

      const pieces = [...grid.querySelectorAll<HTMLElement>("[data-maze]")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, x: rect.left - box.left, y: rect.top - box.top, rect };
      });
      size = { width, height, distance: Math.max(0, box.top - innerHeight, -box.bottom) };
      placed = anchors.flatMap(({ at, corner, radius, media }) => {
        const piece = pieces.find(({ element }) => element.dataset.maze === at);
        if (!piece || (media && !matchMedia(media).matches)) return [];
        const x = piece.x + corner[0] * piece.rect.width;
        const y = piece.y + corner[1] * piece.rect.height;
        return [{ at, x, y, radius }];
      });
      grown = new Map();

      const [whole, outer] = await masks(placed, size.distance);
      if (request !== latest) return;
      grid.style.setProperty("--maze-whole", `url(${whole})`);
      grid.style.setProperty("--maze-outer", `url(${outer})`);
      grid.style.setProperty("--maze-size", `${width}px ${height}px`);
      for (const { element, x, y } of pieces) {
        element.style.setProperty("--maze-at", `${-x}px ${-y}px`);
      }
      grid.dataset.mazeReady = "";
      // then the grown ones, so the first hover is ready
      for (const id of new Set(placed.map((anchor) => anchor.at))) void grownFor(id);
    };

    // the card whose growth the grid holds, even as it shrinks back
    let shown: string | undefined;
    const grow = async (id: string | undefined) => {
      if (id === hovered) return;
      hovered = id;
      const reveal = placed.filter((anchor) => anchor.at === id);
      if (!id || reveal.length === 0) return void delete grid.dataset.mazeGrow;

      const [whole, outer] = await grownFor(id);
      if (hovered !== id) return;
      // from one card to the next, the last one's growth goes at once, so this one's grows
      // from the start
      if (shown && shown !== id) {
        grid.style.transition = "none";
        delete grid.dataset.mazeGrow;
        void grid.offsetWidth;
        grid.style.transition = "";
      }
      shown = id;
      grid.style.setProperty("--maze-grown-whole", `url(${whole})`);
      grid.style.setProperty("--maze-grown-outer", `url(${outer})`);
      grid.style.setProperty(
        "--maze-reveal",
        reveal
          .map(({ x, y, radius }) => {
            const reach = radius * GROW * 1.25;
            return `radial-gradient(circle at ${x}px ${y}px, #000 calc(var(--maze-grow) * ${reach}px - 24px), transparent calc(var(--maze-grow) * ${reach}px))`;
          })
          .join(", "),
      );
      // the grown masks show only within the reveals, which add up
      grid.style.setProperty(
        "--maze-composite",
        ["intersect", ...reveal.slice(1).map(() => "add")].join(", "),
      );
      grid.dataset.mazeGrown = "";
      grid.dataset.mazeGrow = "";
    };

    // the cards that answer: those that are, or hold, a link or a button
    const cardOf = (target: EventTarget | null) => {
      const card = target instanceof Element ? target.closest("[data-maze-card]") : null;
      return card instanceof HTMLElement ? card.dataset.mazeCard : undefined;
    };
    for (const piece of grid.querySelectorAll<HTMLElement>("[data-maze]")) {
      const card = piece.parentElement!;
      if (card.matches("a, button") || card.querySelector("a, button")) {
        card.dataset.mazeCard = piece.dataset.maze;
      }
    }
    const over = (event: PointerEvent) => void grow(cardOf(event.target));
    const leave = () => void grow(undefined);
    const focus = (event: FocusEvent) =>
      void grow(
        event.target instanceof Element && event.target.matches(":focus-visible")
          ? cardOf(event.target)
          : undefined,
      );
    const blur = (event: FocusEvent) => {
      if (!cardOf(event.relatedTarget)) void grow(undefined);
    };
    grid.addEventListener("pointerover", over);
    grid.addEventListener("pointerleave", leave);
    grid.addEventListener("focusin", focus);
    grid.addEventListener("focusout", blur);

    void paint();
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) return void (first = false);
      clearTimeout(timer);
      timer = setTimeout(paint, 150);
    });
    observer.observe(grid);
    return () => {
      latest++;
      clearTimeout(timer);
      observer.disconnect();
      grid.removeEventListener("pointerover", over);
      grid.removeEventListener("pointerleave", leave);
      grid.removeEventListener("focusin", focus);
      grid.removeEventListener("focusout", blur);
    };
  }, [anchors]);

  return ref;
}

/** The class a maze's grid takes, for the timing of its growth. */
export const mazeGrid = styles.grid;

/** A card's piece of its grid's labyrinth, behind the card's content. */
export function MazePiece({
  id,
  color,
  inner,
}: {
  id: string;
  color: string;
  /** The tone the labyrinth keeps running in through the patch's core. */
  inner: string;
}) {
  return (
    <span
      className={styles.piece}
      data-maze={id}
      style={{ "--maze-color": color, "--maze-inner": inner } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.grown} />
    </span>
  );
}
