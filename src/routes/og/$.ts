import { createFileRoute } from "@tanstack/react-router";
import { getLocale, getMessages } from "gt-tanstack-start";
import { readCard } from "#app/server/og/cards";

export const Route = createFileRoute("/og/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const language = { locale: getLocale(), m: await getMessages() };
        const png = await readCard(params._splat ?? "", language);
        if (!png) return new Response("Not Found", { status: 404 });
        return new Response(png, {
          headers: {
            "content-type": "image/png",
            "content-length": String(png.byteLength),
            "cache-control": "public, max-age=3600, stale-while-revalidate=86400"
          }
        });
      }
    }
  }
});
