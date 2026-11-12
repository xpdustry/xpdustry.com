interface Expression {
  expression: string;
}

/** An argument evaluated in the page, such as `document.currentScript`, instead of serialized. */
export const inPage = (expression: string): Expression => ({ expression });

/**
 * The source of a script that calls `standalone` with `args` as the page parses.
 * `standalone` is serialized by its source text: it can use its parameters and the page's
 * globals, and nothing from the module that defines it.
 */
export function inlineScript<Args extends unknown[]>(
  standalone: (...args: Args) => void,
  ...args: { [Index in keyof Args]: Args[Index] | Expression }
): string {
  const serialized = args.map((arg) =>
    typeof arg === "object" && arg !== null && "expression" in arg
      ? (arg as Expression).expression
      : JSON.stringify(arg),
  );
  return `(${standalone.toString()})(${serialized.join(", ")})`;
}
