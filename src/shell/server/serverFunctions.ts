/** Where TanStack Start answers server function calls, one path per function. */
const BASE = "/_serverFn/";

const modules = import.meta.glob<Record<string, unknown>>("/src/**/*.functions.ts", {
  eager: true
});

const hasPath = (value: unknown): value is { url: string } =>
  typeof value === "function" && typeof (value as { url?: unknown }).url === "string";

/** The path of every server function the app defines, which live in `*.functions.ts` files. */
const SERVER_FUNCTION_PATHS: ReadonlySet<string> = new Set(
  Object.values(modules)
    .flatMap((exports) => Object.values(exports))
    .filter(hasPath)
    .map((serverFn) => serverFn.url)
);

/**
 * A plain 404 for a server function path the app does not define. TanStack Start would answer it
 * with a 500 that carries its internal error message.
 */
export function unknownServerFunction(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith(BASE) || SERVER_FUNCTION_PATHS.has(pathname)) return undefined;
  return new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}
