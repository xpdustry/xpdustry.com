export default function drift(
  element: HTMLElement,
  query: string,
  tile: number,
  far: number,
  near: number
) {
  if (CSS.supports("animation-timeline: scroll()")) return;
  const motion = matchMedia(query);
  let frame = 0;
  const update = () => {
    frame = 0;
    element.style.setProperty("--far", `${-((scrollY / far) % tile)}px`);
    element.style.setProperty("--near", `${-((scrollY / near) % tile)}px`);
  };
  const scroll = () => {
    frame ||= requestAnimationFrame(update);
  };
  const toggle = () => {
    removeEventListener("scroll", scroll);
    cancelAnimationFrame(frame);
    frame = 0;
    if (motion.matches) {
      element.dataset.drift = "";
      update();
      addEventListener("scroll", scroll, { passive: true });
    } else delete element.dataset.drift;
  };
  toggle();
  motion.addEventListener("change", toggle);
}
