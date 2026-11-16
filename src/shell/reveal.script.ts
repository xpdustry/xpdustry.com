export default function reveal(): void {
  const show = () => {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let order = 0;
      for (const block of document.querySelectorAll<HTMLElement>(".reveal")) {
        const rect = block.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) continue;
        block.animate([{ translate: "0 12px" }, { translate: "0 0" }], {
          duration: 350,
          delay: Math.min(order++ * 40, 120),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards"
        });
      }
    } catch {}
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", show, { once: true });
  } else {
    show();
  }
}
