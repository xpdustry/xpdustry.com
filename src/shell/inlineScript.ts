interface Expression {
  expression: string;
}

/** An argument evaluated in the page, such as `document.currentScript`, instead of serialized. */
export const inPage = (expression: string): Expression => ({ expression });

/**
 * The source of a script that calls `standalone` with `args` as the page parses.
 * `standalone` is compiled from a `.script.ts?raw` import: it can use its parameters and the page's
 * globals, and nothing from the module that defines it.
 */
export function inlineScript(standalone: string, ...args: unknown[]): string {
  const serialized = args.map((arg) =>
    typeof arg === "object" && arg !== null && "expression" in arg
      ? (arg as Expression).expression
      : JSON.stringify(arg)
  );
  return `(${standalone})(${serialized.join(", ")})`;
}
