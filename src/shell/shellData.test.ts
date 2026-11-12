import { describe, expect, test } from "vitest";
import { HUB, servers } from "#app/status/servers";
import type { ServerInfo } from "#app/status/snapshots";
import { shellData } from "./shellData";

const info: ServerInfo = {
  name: "Hub",
  description: "",
  map: "Ground Zero",
  mode: "survival",
  players: 7,
  playerLimit: 50,
  wave: 3,
  version: 159,
  versionType: "official"
};

describe("shellData", () => {
  test("draws an English shell, still checking, when the root loader never finished", () => {
    expect(shellData(undefined)).toEqual({
      locale: "en",
      translations: {},
      players: { state: "polling" }
    });
  });

  test("draws the loaded language and counts the players online", () => {
    const translations = {};
    const data = shellData({
      locale: "fr",
      translations,
      live: {
        servers: {
          servers: [
            { ...HUB, status: "online", info },
            ...servers.slice(1).map((server) => ({ ...server, status: "offline" as const }))
          ]
        },
        releases: {}
      }
    });

    expect(data).toEqual({ locale: "fr", translations, players: { state: "online", players: 7 } });
  });
});
