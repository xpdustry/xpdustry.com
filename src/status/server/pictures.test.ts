import { describe, expect, test, vi } from "vitest";
import type { Teammate } from "#app/brand/team";
import { Pictures } from "./pictures";

const CDN = "https://cdn.discordapp.com";
const ZETAMAP = "534031087094071307";

const person = (id: string, extra: Partial<Teammate> = {}): Teammate => ({
  id,
  name: id,
  tags: ["moderator"],
  ...extra
});

/** A CDN that answers every picture but `broken`, with its path as the body. */
function cdn(broken = new Set<string>()): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const { pathname } = new URL(input instanceof Request ? input.url : input);
    if (broken.has(pathname)) return new Response(null, { status: 500 });
    return new Response(pathname, { headers: { "content-type": "image/webp" } });
  });
}

const signal = new AbortController().signal;
const text = (picture?: { body: Uint8Array }) => picture && new TextDecoder().decode(picture.body);

describe("the team's pictures", () => {
  test("serves the CDN's faces and banners from here, once each", async () => {
    const pictures = new Pictures();
    const fetchImpl = cdn();
    const team = [
      person("1", {
        avatar: `${CDN}/avatars/1/abc.webp?size=128`,
        banner: `${CDN}/banners/1/def.webp?size=480`
      }),
      person("2", { avatar: "/phinner.svg" })
    ];

    const localised = await pictures.localise(team, signal, fetchImpl);
    await pictures.localise(team, signal, fetchImpl);

    expect(localised.map(({ avatar, banner }) => [avatar, banner])).toEqual([
      ["/discord/avatars/1/abc.webp", "/discord/banners/1/def.webp"],
      ["/phinner.svg", undefined]
    ]);
    expect(text(pictures.get("/avatars/1/abc.webp"))).toBe("/avatars/1/abc.webp");
    expect(pictures.get("/avatars/1/abc.webp")?.type).toBe("image/webp");
    // The second refresh found both already copied.
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test("forgets a picture once nobody shows it", async () => {
    const pictures = new Pictures();
    await pictures.localise(
      [person("1", { avatar: `${CDN}/avatars/1/old.webp?size=128` })],
      signal,
      cdn()
    );

    await pictures.localise(
      [person("1", { avatar: `${CDN}/avatars/1/new.webp?size=128` })],
      signal,
      cdn()
    );

    expect(pictures.get("/avatars/1/old.webp")).toBeUndefined();
    expect(pictures.get("/avatars/1/new.webp")).toBeDefined();
  });

  test("falls back to team.json's face, never to Discord's, when a copy fails", async () => {
    const pictures = new Pictures();
    const fetchImpl = cdn(new Set([`/avatars/${ZETAMAP}/abc.webp`, "/banners/2/def.webp"]));

    const [zetamap, stranger] = await pictures.localise(
      [
        person(ZETAMAP, { avatar: `${CDN}/avatars/${ZETAMAP}/abc.webp?size=128` }),
        person("2", {
          avatar: `${CDN}/embed/avatars/3.png`,
          banner: `${CDN}/banners/2/def.webp?size=480`
        })
      ],
      signal,
      fetchImpl
    );

    expect(zetamap?.avatar).toBe("/zetamap.webp");
    expect(stranger).toMatchObject({ avatar: "/discord/embed/avatars/3.png", banner: undefined });
  });

  test("refuses what is not a picture", async () => {
    const pictures = new Pictures();
    const fetchImpl = vi.fn(
      async () => new Response("<html>", { headers: { "content-type": "text/html" } })
    );

    const [stranger] = await pictures.localise(
      [person("2", { avatar: `${CDN}/avatars/2/abc.webp?size=128` })],
      signal,
      fetchImpl
    );

    expect(stranger?.avatar).toBeUndefined();
    expect(pictures.get("/avatars/2/abc.webp")).toBeUndefined();
  });

  test("copies a face two teammates share once", async () => {
    const pictures = new Pictures();
    const fetchImpl = cdn();
    const avatar = `${CDN}/embed/avatars/3.png`;

    const team = await pictures.localise(
      [person("1", { avatar }), person("2", { avatar })],
      signal,
      fetchImpl
    );

    expect(team.map((teammate) => teammate.avatar)).toEqual([
      "/discord/embed/avatars/3.png",
      "/discord/embed/avatars/3.png"
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("stops downloading a picture past a megabyte", async () => {
    const pictures = new Pictures();
    let sent = 0;
    let cancelled = false;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 64 * 1024;
        controller.enqueue(new Uint8Array(64 * 1024));
      },
      cancel() {
        cancelled = true;
      }
    });
    const fetchImpl = vi.fn(
      async () => new Response(endless, { headers: { "content-type": "image/webp" } })
    );

    const [stranger] = await pictures.localise(
      [person("2", { avatar: `${CDN}/avatars/2/abc.webp?size=128` })],
      signal,
      fetchImpl
    );

    expect(stranger?.avatar).toBeUndefined();
    expect(cancelled).toBe(true);
    expect(sent).toBeLessThan(2 * 1024 * 1024);
  });
});
