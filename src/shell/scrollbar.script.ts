/**
 * Hide the page's scrollbar and draw a thumb over the page instead, wherever it is used with a mouse:
 * a scrollbar that takes room from the layout shifts it between pages that scroll and pages that do
 * not, and the overlay ones of Chromium on Linux never come back once they fade. A scrollbar that
 * floats over the page under a finger, as on phones, is left be.
 */
export default function scrollbar(
  track: HTMLElement,
  inset: number,
  shortest: number,
  idle: number,
  reach: number,
  mouse: string
) {
  const root = document.documentElement;
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;top:-99px;width:50px;height:50px;overflow:scroll";
  document.body.append(probe);
  const gutter = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  if (!gutter && !matchMedia(mouse).matches) return;
  root.dataset.scrollbar = "";

  const thumb = track.firstElementChild as HTMLElement;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let drag: { y: number; top: number } | undefined;

  // The track spans the viewport, which `clientHeight` gives even while the track is hidden.
  const measure = () => {
    const view = root.clientHeight;
    const range = root.scrollHeight - view;
    const room = view - 2 * inset;
    // On a screen too short for the shortest thumb, the thumb gives way so it can still travel.
    const length = Math.max(Math.min(shortest, room / 2), (room * view) / root.scrollHeight);
    return { range, length, travel: room - length };
  };
  const update = () => {
    frame = 0;
    const { range, length, travel } = measure();
    track.toggleAttribute("data-off", range <= 0);
    thumb.style.height = `${length}px`;
    thumb.style.transform = `translateY(${range > 0 ? (root.scrollTop / range) * travel : 0}px)`;
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  const rest = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!drag) delete track.dataset.active;
    }, idle);
  };
  const scrollTo = (top: number) => root.scrollTo({ top, behavior: "instant" });

  addEventListener(
    "scroll",
    () => {
      track.dataset.active = "";
      rest();
      schedule();
    },
    { passive: true }
  );
  // The body's size misses overflow from positioned content, so the track also checks when it is
  // reached for and once the page has loaded.
  addEventListener("resize", schedule);
  addEventListener("load", schedule);
  track.addEventListener("pointerenter", update);

  // A mouse near the edge shows the thumb. Where it last moved is kept once it leaves the page, so
  // one thrown past the edge, as onto the frame of a maximized window, still shows it.
  const near = (on: boolean) => {
    if (on === track.hasAttribute("data-near")) return;
    track.toggleAttribute("data-near", on);
    if (on) update();
  };
  root.addEventListener("pointermove", (event) => {
    near(event.pointerType === "mouse" && innerWidth - event.clientX <= reach);
  });
  new ResizeObserver(schedule).observe(document.body);
  update();

  /** Bring the thumb's middle under `y`, as a press on the track beside the thumb does. */
  const jump = (y: number) => {
    const { range, length, travel } = measure();
    const at = y - track.getBoundingClientRect().top - inset - length / 2;
    scrollTo((Math.min(Math.max(at, 0), travel) / travel) * range);
  };

  // Where nothing can travel, as on a page that does not scroll, a press does nothing.
  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || measure().travel <= 0) return;
    event.preventDefault();
    if (event.target === track) jump(event.clientY);
    drag = { y: event.clientY, top: root.scrollTop };
    track.setPointerCapture(event.pointerId);
    track.dataset.drag = "";
  });
  track.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const { range, travel } = measure();
    if (travel > 0) scrollTo(drag.top + ((event.clientY - drag.y) * range) / travel);
  });
  const release = () => {
    drag = undefined;
    delete track.dataset.drag;
    rest();
  };
  track.addEventListener("pointerup", release);
  track.addEventListener("pointercancel", release);
}
