import { describe, expect, test } from "vitest";
import { serverInfoPacket as packet } from "#tests/support/mindustryPacket";
import { MalformedPacketError, TruncatedPacketError, decodeServerInfo } from "./protocol";

const bytes = (...hex: string[]) => Uint8Array.from(Buffer.from(hex.join(""), "hex"));

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
    expect(decodeServerInfo(packet({ description: "" })).description).toBe("");
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

  test.each([0, 5, 30, 70])("refuses a packet cut to %i bytes", (length) => {
    expect(() => decodeServerInfo(packet().slice(0, length))).toThrow(TruncatedPacketError);
  });

  test("refuses a string longer than the packet", () => {
    const longerName = packet();
    longerName[0] = 255;
    expect(() => decodeServerInfo(longerName)).toThrow(MalformedPacketError);
  });

  test("names an ordinal the game does not know survival", () => {
    expect(decodeServerInfo(packet({ mode: 5 })).mode).toBe("survival");
  });

  test("refuses an ordinal past 127, a negative byte the game fails to read", () => {
    expect(() => decodeServerInfo(packet({ mode: 200 }))).toThrow(MalformedPacketError);
  });

  test("reads negative counts as the game does", () => {
    expect(
      decodeServerInfo(packet({ players: -1, wave: -5, playerLimit: -2_147_483_648 }))
    ).toMatchObject({ players: -1, wave: -5, playerLimit: -2_147_483_648 });
  });

  test("reads a packet a newer server extended with more fields", () => {
    expect(decodeServerInfo(new Uint8Array([...packet(), 0, 0, 0]))).toEqual(
      decodeServerInfo(packet())
    );
  });
});
