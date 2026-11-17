export default function scrollbar(
  track: HTMLElement,
  thumbOptions: { insetPx: number; minLengthPx: number; mouseReachPx: number; lingerMs: number },
  finePointer: string
) {
  const { insetPx, minLengthPx, mouseReachPx, lingerMs } = thumbOptions;
  const root = document.documentElement;

  const scrollbarWidth = () => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;top:-99px;width:50px;height:50px;overflow:scroll";
    document.body.append(probe);
    const width = probe.offsetWidth - probe.clientWidth;
    probe.remove();
    return width;
  };
  const takesLayoutRoom = scrollbarWidth() > 0;
  const usedWithMouse = matchMedia(finePointer).matches;
  if (!takesLayoutRoom && !usedWithMouse) return;
  root.dataset.scrollbar = "";

  const thumb = track.firstElementChild as HTMLElement;
  let frame = 0;
  let lingering: ReturnType<typeof setTimeout> | undefined;
  let drag: { y: number; top: number } | undefined;

  const measure = () => {
    const viewport = root.clientHeight;
    const range = root.scrollHeight - viewport;
    const room = viewport - 2 * insetPx;
    const shortestThatTravels = Math.min(minLengthPx, room / 2);
    const length = Math.max(shortestThatTravels, (room * viewport) / root.scrollHeight);
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
  const fadeOnceIdle = () => {
    clearTimeout(lingering);
    lingering = setTimeout(() => {
      if (!drag) delete track.dataset.active;
    }, lingerMs);
  };
  const scrollTo = (top: number) => root.scrollTo({ top, behavior: "instant" });

  addEventListener(
    "scroll",
    () => {
      track.dataset.active = "";
      fadeOnceIdle();
      schedule();
    },
    { passive: true }
  );
  // A ResizeObserver on the body misses overflow from positioned content: measure again on load and
  // when the track is reached for.
  new ResizeObserver(schedule).observe(document.body);
  addEventListener("resize", schedule);
  addEventListener("load", schedule);
  track.addEventListener("pointerenter", update);

  const showWhenMouseNear = (near: boolean) => {
    if (near === track.hasAttribute("data-near")) return;
    track.toggleAttribute("data-near", near);
    if (near) update();
  };
  root.addEventListener("pointermove", (event) => {
    showWhenMouseNear(event.pointerType === "mouse" && innerWidth - event.clientX <= mouseReachPx);
  });
  update();

  const centerThumbOn = (y: number) => {
    const { range, length, travel } = measure();
    const at = y - track.getBoundingClientRect().top - insetPx - length / 2;
    scrollTo((Math.min(Math.max(at, 0), travel) / travel) * range);
  };
  const canTravel = () => measure().travel > 0;

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !canTravel()) return;
    event.preventDefault();
    if (event.target === track) centerThumbOn(event.clientY);
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
    fadeOnceIdle();
  };
  track.addEventListener("pointerup", release);
  track.addEventListener("pointercancel", release);
}
