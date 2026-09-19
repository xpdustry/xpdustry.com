import type { APIEvent } from "filesystem-routing/api";
import { readCard } from "#app/server/og/cards";

// Discord and Twitter fetch the card once per unfurl and cache it on their
// side, so the header mostly serves browsers and the odd proxy.
export async function GET(event: APIEvent): Promise<Response> {
  const png = await readCard(event.params?.card ?? "");
  if (!png) return new Response("Not Found", { status: 404 });

  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "content-length": String(png.byteLength),
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
