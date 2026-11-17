import { createFileRoute } from "@tanstack/react-router";
import { services } from "#app/status/server/services";

const NAMED_AFTER_CONTENT = "public, max-age=31536000, immutable";

export const Route = createFileRoute("/discord/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const picture = services().pictures.get(`/${params._splat ?? ""}`);
        if (!picture) return new Response("Not Found", { status: 404 });
        return new Response(picture.body, {
          headers: {
            "content-type": picture.type,
            "cache-control": NAMED_AFTER_CONTENT,
            "x-content-type-options": "nosniff"
          }
        });
      }
    }
  }
});
