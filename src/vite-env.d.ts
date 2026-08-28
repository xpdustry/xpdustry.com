/// <reference types="vite/client" />
/// <reference types="filesystem-routing/types" />

declare module "virtual:solid-ssr-handler" {
  export function handleRequest(request: Request): Promise<Response>;
  const handler: { fetch: (request: Request) => Promise<Response> };
  export default handler;
}
