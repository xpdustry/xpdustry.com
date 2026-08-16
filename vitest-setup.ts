// Registers @testing-library/jest-dom's matchers (toHaveTextContent etc.)
// with vitest's expect, including their types.
import "@testing-library/jest-dom/vitest";

// jsdom defines scrollTo but throws "Not implemented" from it, because it has
// no layout. The router calls it after every navigation, which turns a passing
// test into a wall of unhandled errors, so it is replaced outright.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}
