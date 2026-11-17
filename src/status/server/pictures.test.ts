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
  test("serves the CDN's faces and banners from the site, by their path on the CDN", async () => {
    const pictures = new Pictures();
    const team = [
      person("1", {
        avatar: `${CDN}/avatars/1/abc.webp?size=128`,
        banner: `${CDN}/banners/1/def.webp?size=512`
      }),
      person("2", { avatar: "/phinner.svg" })
    ];

    const localised = await pictures.localise(team, signal, cdn());

    expect(localised.map(({ avatar, banner }) => [avatar, banner])).toEqual([
      ["/discord/avatars/1/abc.webp", "/discord/banners/1/def.webp"],
      ["/phinner.svg", undefined]
    ]);
    for (const path of ["/avatars/1/abc.webp", "/banners/1/def.webp"]) {
      expect(pictures.get(path)).toEqual(await cdnPicture(path));
    }
  });

  test("downloads a picture it already has no more", async () => {
    const pictures = new Pictures();
    const team = [person("1", { avatar: `${CDN}/avatars/1/abc.webp?size=128` })];
    await pictures.localise(team, signal, cdn());
    const refresh = cdn();

    await pictures.localise(team, signal, refresh);

    expect(refresh).not.toHaveBeenCalled();
    expect(pictures.get("/avatars/1/abc.webp")).toBeDefined();
  });

  test("copies a face two teammates share once", async () => {
    const fetchImpl = cdn();
    const avatar = `${CDN}/embed/avatars/3.png`;

    const team = await new Pictures().localise(
      [person("1", { avatar }), person("2", { avatar })],
      signal,
      fetchImpl
    );

    expect(team.map((teammate) => teammate.avatar)).toEqual([
      "/discord/embed/avatars/3.png",
      "/discord/embed/avatars/3.png"
    ]);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  test("forgets a picture once nobody shows it", async () => {
    const pictures = new Pictures();
    const showing = (avatar: string) => [person("1", { avatar: `${CDN}${avatar}?size=128` })];

    await pictures.localise(showing("/avatars/1/old.webp"), signal, cdn());
    await pictures.localise(showing("/avatars/1/new.webp"), signal, cdn());

    expect(pictures.get("/avatars/1/old.webp")).toBeUndefined();
    expect(pictures.get("/avatars/1/new.webp")).toBeDefined();
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
