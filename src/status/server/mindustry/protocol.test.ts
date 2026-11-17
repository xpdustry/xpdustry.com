import { describe, expect, test } from "vitest";
import { serverInfoPacket as packet } from "#tests/support/mindustryPacket";
import { MalformedPacketError, decodeServerInfo } from "./protocol";

describe("decodeServerInfo", () => {
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

  test.each([1, 5, 12, 20, 33, 40, 50, 60, 70])("refuses a packet cut to %i bytes", (length) => {
    expect(() => decodeServerInfo(packet().slice(0, length))).toThrow(MalformedPacketError);
  });

  test("refuses a string longer than the packet", () => {
    const bytes = packet();
    bytes[0] = 255;
    expect(() => decodeServerInfo(bytes)).toThrow(MalformedPacketError);
  });

  test.each([
    ["an unknown gamemode", { mode: 99 }],
    ["a negative player count", { players: -1 }],
    ["two million players", { players: 2_000_000 }],
    ["a negative wave", { wave: -5 }]
  ])("refuses a packet with %s", (_label, fields) => {
    expect(() => decodeServerInfo(packet(fields))).toThrow(MalformedPacketError);
  });

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
