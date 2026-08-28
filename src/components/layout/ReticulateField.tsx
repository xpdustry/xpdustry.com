import reticulate from "#app/assets/reticulate.png";

/**
 * The site's background: reticulate whipray skin.
 *
 * The tile is baked by `vite/generate-reticulate.ts`, which runs Malheiros'
 * bounded Turing model with growth (SIGGRAPH 2020) and writes out the coverage
 * of the resulting net. Because the simulation wraps, the tile repeats without
 * a seam, so a field is one masked element rather than a set of placed shapes.
 *
 * One field per page, and one look for all of them. Two of these on a page
 * put two nets of the same scale at different phases, and the overlap reads as
 * a third, coarser pattern woven through both — so the component takes no
 * artwork and no options, and pages place it exactly once.
 *
 * Three jobs, kept on three separate mechanisms so none of them needs mask
 * compositing: the outer element fades the field out down the page, the inner
 * element carries the pattern as a mask, and the ink under that mask is a
 * gradient across the key ramp.
 */
export function ReticulateField() {
  return (
    <div
      class="reticulate pointer-events-none absolute inset-x-0 top-0 -z-1 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="reticulate__net absolute inset-0"
        style={{ "mask-image": `url(${reticulate})` }}
      />
    </div>
  );
}
