import { describe, expect, test } from "vitest";
import {
  packetClaimingLongerName,
  serverInfoPacket as packet
} from "#tests/support/mindustryPacket";
import { MalformedPacketError, TruncatedPacketError, decodeServerInfo } from "./protocol";

const bytes = (...hex: string[]) => Uint8Array.from(Buffer.from(hex.join(""), "hex"));

const OVERLONG_FIELDS = {
  name: `${"x".repeat(99)}é`,
  map: "€".repeat(22),
  players: -1,
  wave: 7,
  version: 146,
  versionType: `bleeding-edge-${"🌍".repeat(5)}`,
  mode: 3,
  playerLimit: 2_000_000,
  description: "d".repeat(120),
  modeName: "Ж".repeat(26),
  port: 6567
};

const AS_THE_GAME_WRITES_THEM = bytes(
  "64",
  "78".repeat(99),
  "c3",
  "40",
  "e282ac".repeat(21),
  "e2",
  "ffffffff",
  "00000007",
  "00000092",
  "20",
  Buffer.from("bleeding-edge-").toString("hex"),
  "f09f8c8d".repeat(4),
  "f09f",
  "03",
  "001e8480",
  "64",
  "64".repeat(100),
  "32",
  "d096".repeat(25),
  "19a7"
);

test("writes overlong fields the way the game's writeServerData does", () => {
  expect(packet(OVERLONG_FIELDS)).toEqual(AS_THE_GAME_WRITES_THEM);
});

describe("decodeServerInfo", () => {
  test("reads overlong fields the game cut as the game's readServerData does", () => {
    expect(decodeServerInfo(AS_THE_GAME_WRITES_THEM)).toEqual({
      name: `${"x".repeat(99)}\uFFFD`,
      map: `${"€".repeat(21)}\uFFFD`,
      mode: "Ж".repeat(25),
      description: "d".repeat(100),
      players: -1,
      playerLimit: 2_000_000,
      wave: 7,
      version: 146,
      versionType: `bleeding-edge-${"🌍".repeat(4)}\uFFFD`
    });
  });

  test("reads what a server says about itself", () => {
    expect(decodeServerInfo(packet())).toEqual({
      name: "<CN> Survival",
      map: "Fungal Pass",
      mode: "survival",
      description: "The best server",
      players: 27,
      playerLimit: 50,
      wave: 142,
      version: 159,
      versionType: "official"
    });
  });

  test("strips colour markup from what it shows", () => {
    const decoded = decodeServerInfo(
      packet({
        name: "[accent]<CN>[] Survival",
        map: "[#ff8800]Fungal Pass[]",
        description: "[gold]The best[] server"
      })
    );
    expect([decoded.name, decoded.map, decoded.description]).toEqual([
      "<CN> Survival",
      "Fungal Pass",
      "The best server"
    ]);
  });

  test.each([
    [
      "by the custom name a server gives it",
      { mode: 0, modeName: "[red]Tower Defense[]" },
      "Tower Defense"
    ],
    ["by its ordinal without one", { mode: 3 }, "pvp"]
  ])("names the gamemode %s", (_label, fields, mode) => {
    expect(decodeServerInfo(packet(fields)).mode).toBe(mode);
  });

  test("refuses on purpose an empty datagram, which the game would show as a nameless survival server", () => {
    const GAME_RECEIVE_BUFFER_BYTES = 512;
    const asTheGameReadsIt = new Uint8Array(GAME_RECEIVE_BUFFER_BYTES);

    expect(decodeServerInfo(asTheGameReadsIt)).toEqual({
      name: "",
      map: "",
      mode: "survival",
      description: "",
      players: 0,
      playerLimit: 0,
      wave: 0,
      version: 0,
      versionType: ""
    });
    expect(() => decodeServerInfo(new Uint8Array())).toThrow(TruncatedPacketError);
  });

  test.each([1, 5, 12, 20, 33, 40, 50, 60, 70])("refuses a packet cut to %i bytes", (length) => {
    expect(() => decodeServerInfo(packet().slice(0, length))).toThrow(TruncatedPacketError);
  });

  test("refuses a string longer than the packet", () => {
    expect(() => decodeServerInfo(packetClaimingLongerName())).toThrow(MalformedPacketError);
  });

  test.each([5, 99, 127])("names an ordinal %i the game does not know survival", (mode) => {
    expect(decodeServerInfo(packet({ mode })).mode).toBe("survival");
  });

  test.each([128, 200, 255])(
    "refuses an ordinal %i, a negative byte the game fails to read",
    (mode) => {
      expect(() => decodeServerInfo(packet({ mode }))).toThrow(MalformedPacketError);
    }
  );

  test.each([
    ["a negative player count", { players: -1 }, { players: -1 }],
    ["two million players", { players: 2_000_000 }, { players: 2_000_000 }],
    ["the largest count", { players: 2_147_483_647 }, { players: 2_147_483_647 }],
    ["the smallest count", { players: -2_147_483_648 }, { players: -2_147_483_648 }],
    ["a negative wave", { wave: -5 }, { wave: -5 }],
    ["a negative player limit", { playerLimit: -1 }, { playerLimit: -1 }]
  ])("reads %s as the game does", (_label, fields, decoded) => {
    expect(decodeServerInfo(packet(fields))).toMatchObject(decoded);
  });

  test.each([
    ["name", 100],
    ["map", 64],
    ["versionType", 32],
    ["description", 100],
    ["modeName", 50]
  ] as const)("reads a %s the game cut to its %i byte budget", (field, budget) => {
    const decoded = decodeServerInfo(packet({ [field]: "x".repeat(budget + 20) }));
    const shown = field === "modeName" ? decoded.mode : decoded[field];
    expect(shown).toBe("x".repeat(budget));
  });

  test.each([
    ["two", "é", 1],
    ["three", "€", 1],
    ["three", "€", 2],
    ["four", "🌍", 1],
    ["four", "🌍", 2],
    ["four", "🌍", 3]
  ])(
    "shows a %s byte %s the game cut after %i of its bytes as U+FFFD, as the game reads it",
    (_size, character, kept) => {
      const name = "x".repeat(100 - kept) + character;
      expect(decodeServerInfo(packet({ name })).name).toBe(`${"x".repeat(100 - kept)}\uFFFD`);
    }
  );

  test("reads a packet a newer server extended with more fields", () => {
    expect(decodeServerInfo(new Uint8Array([...packet(), 0, 0, 0]))).toEqual(
      decodeServerInfo(packet())
    );
  });

  test("keeps the server's port to itself", () => {
    expect(decodeServerInfo(packet({ port: 65535 }))).not.toHaveProperty("port");
  });

  test("reads an empty description", () => {
    expect(decodeServerInfo(packet({ description: "" })).description).toBe("");
  });
});
