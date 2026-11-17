import { describe, expect, test, vi } from "vitest";
import type { Teammate } from "#app/brand/team";
import { CDN, cdnPicture, discordCdn } from "#tests/support/discordCdn";
import { fakeFetch } from "#tests/support/fetch";
import { Pictures } from "./pictures";

const ZETAMAP = "534031087094071307";

const person = (id: string, extra: Partial<Teammate> = {}): Teammate => ({
  id,
  name: id,
  tags: ["moderator"],
  ...extra
});

const cdn = (...broken: string[]) => fakeFetch(discordCdn(new Set(broken)));
const answering = (response: () => Response) => vi.fn<typeof fetch>(async () => response());

const signal = new AbortController().signal;

describe("the team's pictures", () => {
  test("serves the CDN's pictures from the site by their path, copying each once until nobody shows it", async () => {
    const pictures = new Pictures();
    const shared = `${CDN}/embed/avatars/3.png`;
    const team = (face: string) => [
      person("1", {
        avatar: `${CDN}/avatars/1/${face}.webp?size=128`,
        banner: `${CDN}/banners/1/def.webp?size=512`
      }),
      person("2", { avatar: shared }),
      person("3", { avatar: shared }),
      person("4", { avatar: "/phinner.svg" })
    ];
    const first = cdn();

    const localised = await pictures.localise(team("old"), signal, first);

    expect(localised.map(({ avatar, banner }) => [avatar, banner])).toEqual([
      ["/discord/avatars/1/old.webp", "/discord/banners/1/def.webp"],
      ["/discord/embed/avatars/3.png", undefined],
      ["/discord/embed/avatars/3.png", undefined],
      ["/phinner.svg", undefined]
    ]);
    expect(first).toHaveBeenCalledTimes(3);
    for (const path of ["/avatars/1/old.webp", "/banners/1/def.webp", "/embed/avatars/3.png"]) {
      expect(pictures.get(path)).toEqual(cdnPicture(path));
    }
    const unchanged = cdn();
    await pictures.localise(team("old"), signal, unchanged);
    expect(unchanged).not.toHaveBeenCalled();

    await pictures.localise(team("new"), signal, cdn());

    expect(pictures.get("/avatars/1/old.webp")).toBeUndefined();
    expect(pictures.get("/avatars/1/new.webp")).toEqual(cdnPicture("/avatars/1/new.webp"));
    expect(cdnPicture("/avatars/1/new.webp")).not.toEqual(cdnPicture("/avatars/1/old.webp"));
  });

  test("falls back to team.json's face, never to Discord's, when a copy fails", async () => {
    const fetchImpl = cdn(`/avatars/${ZETAMAP}/abc.webp`, "/banners/2/def.webp");

    const [zetamap, stranger] = await new Pictures().localise(
      [
        person(ZETAMAP, { avatar: `${CDN}/avatars/${ZETAMAP}/abc.webp?size=128` }),
        person("2", {
          avatar: `${CDN}/embed/avatars/3.png`,
          banner: `${CDN}/banners/2/def.webp?size=512`
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
    const page = answering(
      () => new Response("<html>", { headers: { "content-type": "text/html" } })
    );

    const [stranger] = await pictures.localise(
      [person("2", { avatar: `${CDN}/avatars/2/abc.webp?size=128` })],
      signal,
      page
    );

    expect(stranger?.avatar).toBeUndefined();
    expect(pictures.get("/avatars/2/abc.webp")).toBeUndefined();
  });

  test("stops downloading a picture past a megabyte", async () => {
    let sent = 0;
    let cancelled = false;
    const endless = answering(
      () =>
        new Response(
          new ReadableStream<Uint8Array>({
            pull(controller) {
              sent += 64 * 1024;
              controller.enqueue(new Uint8Array(64 * 1024));
            },
            cancel() {
              cancelled = true;
            }
          }),
          { headers: { "content-type": "image/webp" } }
        )
    );

    const [stranger] = await new Pictures().localise(
      [person("2", { avatar: `${CDN}/avatars/2/abc.webp?size=128` })],
      signal,
      endless
    );

    expect(stranger?.avatar).toBeUndefined();
    expect(cancelled).toBe(true);
    expect(sent).toBeLessThan(2 * 1024 * 1024);
  });
});
