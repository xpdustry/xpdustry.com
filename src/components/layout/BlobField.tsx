import { For, createUniqueId } from "solid-js";
import grain from "#app/assets/grain-250.png";

/** The field's palette. A shape's `tone` is an index into it. */
const CYAN = ["#7afff8", "#00fff1", "#00c8bd", "#008f88"];

/**
 * Radial offsets, in silhouettes rather than numbers.
 *
 * The node count is most of the character: six nodes give broad lumps, ten
 * give a rolling edge, fourteen give a busy one. Keep the offsets under about
 * ±0.2, and smaller still on the low-node sets, or the curve crosses itself.
 */
const ROUND = [0.04, -0.05, 0.08, -0.03, 0.06, -0.07, 0.03, -0.04, 0.07, -0.02];
const LOBED = [0.13, -0.08, 0.04, -0.12, 0.11, -0.03, 0.08, -0.1, 0.02, -0.06];
const SOFT = [0.02, 0.09, -0.06, 0.05, -0.1, 0.04, -0.02, 0.08, -0.07, 0.03];
const WOBBLE = [0.11, -0.03, -0.09, 0.07, -0.04, 0.12, -0.08, 0.02, 0.06, -0.1];
/** Six nodes: broad, boulder-like. */
const PEBBLE = [0.09, -0.11, 0.06, 0.12, -0.08, 0.04];
/** Seven nodes with one deep pinch, so it reads as a kidney. */
const BEAN = [0.14, -0.02, -0.13, 0.05, 0.1, -0.09, 0.03];
/** Eight nodes, one long pull that gives the shape a direction. */
const DROP = [0.18, 0.02, -0.09, -0.05, 0.07, -0.12, 0.05, -0.03];
/** Fourteen nodes: the busiest edge in the set. */
const SPLAT = [
  0.1, -0.07, 0.12, -0.05, 0.08, -0.11, 0.06, -0.04, 0.13, -0.08, 0.05, -0.1, 0.09, -0.06,
];

type BlobShape = {
  x: number;
  y: number;
  size: string;
  tone: number;
  offsets: readonly number[];
  rotation?: number;
};

/**
 * A whole field, ready to hand to `<BlobField artwork={...} />`.
 *
 * The artworks below are the vocabulary: pick the one whose weight suits the
 * section rather than adding a page-specific entry. Two pages wanting the same
 * field is the normal case, not a duplicate to be named around.
 */
export type BlobArtwork = {
  shapes: readonly BlobShape[];
  /** Field height in pixels. */
  height: number;
  opacity: number;
  /** Anchors the field to the bottom edge of its section instead of the top. */
  bottom?: boolean;
};

const shape = (
  x: number,
  y: number,
  size: string,
  tone: number,
  offsets: readonly number[],
  rotation = 0,
): BlobShape => ({ x, y, size, tone, offsets, rotation });

/** Six shapes, the full height of the field, and the strongest of the set. */
export const HERO_BLOBS: BlobArtwork = {
  height: 980,
  opacity: 0.5,
  shapes: [
    shape(2, 22, "clamp(240px, 36vw, 520px)", 0, DROP, 12),
    shape(16, 58, "clamp(150px, 22vw, 320px)", 1, PEBBLE, 40),
    shape(46, 12, "clamp(110px, 15vw, 210px)", 1, SPLAT, 22),
    shape(97, 20, "clamp(230px, 34vw, 480px)", 3, LOBED, 8),
    shape(84, 52, "clamp(170px, 24vw, 350px)", 2, BEAN, 55),
    shape(60, 84, "clamp(120px, 17vw, 240px)", 0, WOBBLE, 31),
  ],
};

/** Four shapes around a page header: heavy top left, trailing off bottom right. */
export const PAGE_HEAD_BLOBS: BlobArtwork = {
  height: 640,
  opacity: 0.38,
  shapes: [
    shape(4, 18, "clamp(200px, 30vw, 430px)", 0, PEBBLE, 14),
    shape(20, 62, "clamp(120px, 17vw, 240px)", 1, SPLAT, 47),
    shape(93, 28, "clamp(180px, 27vw, 380px)", 3, BEAN, 26),
    shape(72, 78, "clamp(140px, 20vw, 290px)", 2, ROUND, 5),
  ],
};

/** The same job as PAGE_HEAD_BLOBS, mirrored: the weight sits on the right. */
export const PAGE_HEAD_ALT_BLOBS: BlobArtwork = {
  height: 640,
  opacity: 0.38,
  shapes: [
    shape(6, 34, "clamp(150px, 22vw, 320px)", 1, BEAN, 33),
    shape(24, 80, "clamp(110px, 16vw, 220px)", 0, DROP, 8),
    shape(96, 16, "clamp(220px, 32vw, 450px)", 3, PEBBLE, 51),
    shape(80, 58, "clamp(160px, 23vw, 330px)", 2, SPLAT, 19),
  ],
};

/**
 * Four shapes alternating down the margins of a long read.
 *
 * The field is far taller than the others because an article is: two blobs in
 * a 520px box put every shape above the fold and left the rest of the page
 * bare. Nothing crosses x 10..90, so the prose column stays clear.
 */
export const ARTICLE_BLOBS: BlobArtwork = {
  height: 1180,
  opacity: 0.26,
  shapes: [
    shape(2, 10, "clamp(160px, 23vw, 330px)", 0, DROP, 17),
    shape(98, 26, "clamp(190px, 27vw, 380px)", 3, PEBBLE, 44),
    shape(4, 52, "clamp(130px, 19vw, 260px)", 1, SPLAT, 9),
    shape(95, 78, "clamp(150px, 21vw, 300px)", 2, BEAN, 28),
  ],
};

/** Three shapes for a short page, big enough to hold it on their own. */
export const SPARSE_BLOBS: BlobArtwork = {
  height: 620,
  opacity: 0.34,
  shapes: [
    shape(10, 22, "clamp(190px, 28vw, 400px)", 0, SPLAT, 21),
    shape(90, 30, "clamp(160px, 24vw, 340px)", 3, DROP, 63),
    shape(72, 82, "clamp(110px, 16vw, 230px)", 2, PEBBLE, 12),
  ],
};

/** Hangs from the top edge of a band. */
export const BAND_TOP_BLOBS: BlobArtwork = {
  height: 560,
  opacity: 0.3,
  shapes: [
    shape(6, 14, "clamp(180px, 26vw, 370px)", 0, PEBBLE, 27),
    shape(28, 40, "clamp(100px, 15vw, 200px)", 1, SOFT, 52),
    shape(95, 22, "clamp(200px, 29vw, 410px)", 3, SPLAT, 11),
  ],
};

/** Rises from the bottom edge of a band. Pairs with BAND_TOP_BLOBS. */
export const BAND_BOTTOM_BLOBS: BlobArtwork = {
  height: 560,
  opacity: 0.3,
  bottom: true,
  shapes: [
    shape(14, 82, "clamp(175px, 25vw, 360px)", 1, BEAN, 36),
    shape(38, 62, "clamp(105px, 15vw, 215px)", 0, SPLAT, 14),
    shape(92, 74, "clamp(190px, 27vw, 390px)", 3, PEBBLE, 58),
  ],
};

/** Four shapes spread across a band rather than hugging one edge. */
export const BAND_WIDE_BLOBS: BlobArtwork = {
  height: 600,
  opacity: 0.32,
  shapes: [
    shape(5, 24, "clamp(185px, 27vw, 390px)", 0, SPLAT, 19),
    shape(30, 70, "clamp(115px, 17vw, 235px)", 1, PEBBLE, 41),
    shape(66, 18, "clamp(105px, 15vw, 205px)", 2, DROP, 6),
    shape(93, 56, "clamp(170px, 24vw, 350px)", 3, BEAN, 30),
  ],
};

export interface BlobFieldProps {
  artwork: BlobArtwork;
}

/**
 * A field of small, static SVG paths. Each path starts as a circle whose
 * radial nodes have been moved in or out, then a closed cubic curve smooths
 * the joins. There are no full-field SVG effects for Firefox to repaint.
 */
export function BlobField(props: BlobFieldProps) {
  // Two fields can share one artwork on the same page, so the grain pattern is
  // keyed per instance rather than per artwork. `createUniqueId` gives the
  // server and the client the same id, which hydration needs.
  const patternId = createUniqueId();

  return (
    <div
      class={[
        "blobfield pointer-events-none absolute inset-x-0 top-0 -z-1 overflow-hidden",
        { "top-auto bottom-0": Boolean(props.artwork.bottom) },
      ]}
      aria-hidden="true"
      style={{
        "--blob-height": `${props.artwork.height}px`,
        "--blob-opacity": String(props.artwork.opacity),
        "--blob-opacity-dark": String(props.artwork.opacity * 0.85),
      }}
    >
      <For each={props.artwork.shapes}>
        {(blob, index) => (
          <svg
            class="blobfield__shape absolute overflow-visible"
            viewBox="0 0 200 200"
            style={{
              "--blob-x": `${blob.x}%`,
              "--blob-y": `${blob.y}%`,
              "--blob-size": blob.size,
              color: CYAN[blob.tone],
            }}
          >
            <defs>
              <pattern
                id={`blob-grain-${patternId}-${index()}`}
                width="250"
                height="250"
                patternUnits="userSpaceOnUse"
              >
                <image href={grain} width="250" height="250" />
              </pattern>
            </defs>
            <path d={radialBlobPath(blob.offsets, blob.rotation)} fill="currentColor" />
            <path
              class="blobfield__texture"
              d={radialBlobPath(blob.offsets, blob.rotation)}
              fill={`url(#blob-grain-${patternId}-${index()})`}
              opacity="0.4"
            />
          </svg>
        )}
      </For>
    </div>
  );
}

/** Converts evenly-spaced radial offsets into a smooth closed SVG path. */
export function radialBlobPath(offsets: readonly number[], rotation = 0): string {
  if (offsets.length < 4) throw new Error("A blob needs at least four radial nodes");

  const centre = 100;
  const radius = 78;
  const tension = 0.86;
  const startAngle = (rotation * Math.PI) / 180;
  const points = offsets.map((offset, index) => {
    const angle = startAngle + (index / offsets.length) * Math.PI * 2;
    const distance = radius * (1 + offset);
    return {
      x: centre + Math.cos(angle) * distance,
      y: centre + Math.sin(angle) * distance,
    };
  });

  const segments = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const control1 = {
      x: point.x + ((next.x - previous.x) * tension) / 6,
      y: point.y + ((next.y - previous.y) * tension) / 6,
    };
    const control2 = {
      x: next.x - ((afterNext.x - point.x) * tension) / 6,
      y: next.y - ((afterNext.y - point.y) * tension) / 6,
    };
    return `C ${number(control1.x)} ${number(control1.y)} ${number(control2.x)} ${number(control2.y)} ${number(next.x)} ${number(next.y)}`;
  });

  return `M ${number(points[0].x)} ${number(points[0].y)} ${segments.join(" ")} Z`;
}

function number(value: number): string {
  return String(Math.round(value * 100) / 100);
}
