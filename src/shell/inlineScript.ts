class PageExpression {
  constructor(readonly source: string) {}
}

export const inPage = (source: string) => new PageExpression(source);

export function inlineScript(standalone: string, ...args: unknown[]): string {
  const serialized = args.map((arg) =>
    arg instanceof PageExpression ? arg.source : JSON.stringify(arg)
  );
  return `(${standalone})(${serialized.join(", ")})`;
}
