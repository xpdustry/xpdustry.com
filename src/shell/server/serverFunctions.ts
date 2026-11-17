const modules = import.meta.glob<Record<string, unknown>>("/src/**/*.functions.ts", {
  eager: true
});

const hasPath = (value: unknown): value is { url: string } =>
  typeof value === "function" && typeof (value as { url?: unknown }).url === "string";

const SERVER_FUNCTION_PATHS: ReadonlySet<string> = new Set(
  Object.values(modules)
    .flatMap((exports) => Object.values(exports))
    .filter(hasPath)
    .map((serverFn) => serverFn.url)
);

// TanStack Start throws on an unknown id, a 500 that carries its internal message.
export function unknownServerFunction(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);
  if (
    !pathname.startsWith(import.meta.env.TSS_SERVER_FN_BASE) ||
    SERVER_FUNCTION_PATHS.has(pathname)
  ) {
    return undefined;
  }
  return new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}
