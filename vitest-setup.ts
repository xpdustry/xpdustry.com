// Registers @testing-library/jest-dom's matchers (toHaveTextContent etc.)
// with vitest's expect, including their types.
import "@testing-library/jest-dom/vitest";
if (typeof window !== "undefined") window.scrollTo = () => {};
