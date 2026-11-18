export default function reveal(): void {
  const revealing: Animation[] = [];
  let arrivedInATransition = false;
  const rest = () => {
    for (const animation of revealing) animation.finish();
  };
  addEventListener("pagereveal", (event) => {
    if (!event.viewTransition) return;
    arrivedInATransition = true;
    rest();
  });

  const show = () => {
    try {
      const less = matchMedia("(prefers-reduced-motion: reduce)");
      if (less.matches || arrivedInATransition) return;
      let order = 0;
      for (const block of document.querySelectorAll<HTMLElement>(".reveal")) {
        const rect = block.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) continue;
        const animation = block.animate([{ translate: "0 12px" }, { translate: "0 0" }], {
          duration: 350,
          delay: Math.min(order++ * 40, 120),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards"
        });
        revealing.push(animation);
      }
      less.addEventListener("change", rest, { once: true });
    } catch {}
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", show, { once: true });
  } else {
    show();
  }
}
