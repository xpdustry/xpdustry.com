import { useEffect, useState, type RefObject } from "react";

/**
 * Whether the element has been on screen yet, so that what it only needs once the visitor is
 * there can wait until then. It stays true once it is, and is false on the server and until
 * hydration, so both render the same.
 */
export function useSeen(ref: RefObject<Element | null>) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (seen || !element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, seen]);
  return seen;
}
