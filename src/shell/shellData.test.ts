import { describe, expect, test } from "vitest";
import { HUB, servers } from "#app/status/servers";
import type { ServerInfo } from "#app/status/snapshots";
import { shellData } from "./shellData";

describe("shellData", () => {
  test("draws an English shell, still checking, when the root loader never finished", () => {
    expect(shellData(undefined)).toEqual({
      locale: "en",
      translations: {},
      players: { state: "polling" }
    });
  });

  test("draws the loaded language and the players the servers report", () => {
    const translations = {};
    const data = shellData({
      locale: "fr",
      translations,
      live: {
        servers: {
          servers: [
            { ...HUB, status: "online", info: { players: 7 } as ServerInfo },
            ...servers.slice(1).map((server) => ({ ...server, status: "offline" as const }))
          ]
        },
        releases: {}
      }
    });

    expect(data).toEqual({ locale: "fr", translations, players: { state: "online", players: 7 } });
  });
});
