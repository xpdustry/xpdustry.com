import { createFileRoute } from "@tanstack/react-router";
import { services } from "#app/status/server/services";

/** The team's pictures, copied off Discord's CDN so visitors never ask it. Only those, never a proxy. */
export const Route = createFileRoute("/discord/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const picture = services().pictures.get(`/${params._splat ?? ""}`);
        if (!picture) return new Response("Not Found", { status: 404 });
        return new Response(picture.body, {
          headers: {
            "content-type": picture.type,
            // Discord names a picture after its content, so a path always holds the same one.
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff"
          }
        });
      }
    }
  }
});
