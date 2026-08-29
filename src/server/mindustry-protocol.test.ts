import { describe, expect, test } from "vitest";
import {
  MalformedPacketError,
  QUERY_PACKET,
  decodeServerInfo,
} from "#app/server/mindustry-protocol";

/** Builds a reply the way a Mindustry server writes one. */
function packet(
  overrides: Partial<{
    name: string;
    map: string;
    players: number;
    wave: number;
    version: number;
    versionType: string;
    mode: number;
    playerLimit: number;
    description: string;
    modeName: string;
    port: number;
  }> = {},
): Uint8Array {
  const fields = {
    name: "<CN> Survival",
    map: "Fungal Pass",
    players: 27,
    wave: 142,
    version: 159,
    versionType: "official",
    mode: 0,
    playerLimit: 50,
    description: "The best server",
    modeName: "",
    port: 6567,
    ...overrides,
  };

  const parts: number[] = [];
  const encoder = new TextEncoder();
  const string = (value: string) => {
    const bytes = encoder.encode(value);
    parts.push(bytes.length, ...bytes);
  };
  const i32 = (value: number) => {
    parts.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  };

  string(fields.name);
  string(fields.map);
  i32(fields.players);
  i32(fields.wave);
  i32(fields.version);
  string(fields.versionType);
  parts.push(fields.mode);
  i32(fields.playerLimit);
  string(fields.description);
  string(fields.modeName);
  parts.push((fields.port >> 8) & 0xff, fields.port & 0xff);

  return Uint8Array.from(parts);
}

describe("QUERY_PACKET", () => {
  test("is the two-byte framework discover message", () => {
    expect([...QUERY_PACKET]).toEqual([0xfe, 0x01]);
  });
});

describe("decodeServerInfo", () => {
  test("decodes a valid packet", () => {
    expect(decodeServerInfo(packet())).toEqual({
      name: "<CN> Survival",
      map: "Fungal Pass",
      mode: "survival",
      description: "The best server",
      players: 27,
      playerLimit: 50,
      wave: 142,
      version: 159,
      versionType: "official",
    });
  });

  test("strips colour markup from every string field", () => {
    const decoded = decodeServerInfo(
      packet({
        name: "[accent]<CN>[] Survival",
        map: "[#ff8800]Fungal Pass[]",
      }),
    );
    expect(decoded.name).toBe("<CN> Survival");
    expect(decoded.map).toBe("Fungal Pass");
  });

  test("prefers a custom mode name over the gamemode ordinal", () => {
    expect(decodeServerInfo(packet({ mode: 0, modeName: "[red]Tower Defense[]" })).mode).toBe(
      "Tower Defense",
    );
  });

  test("names the gamemode from its ordinal when there is no custom name", () => {
    expect(decodeServerInfo(packet({ mode: 3 })).mode).toBe("pvp");
  });

  test.each([1, 5, 12, 20, 33, 40, 50, 60, 70])(
    "rejects a packet truncated to %i bytes",
    (length) => {
      expect(() => decodeServerInfo(packet().slice(0, length))).toThrow(MalformedPacketError);
    },
  );

  test("rejects a string that claims more bytes than the protocol allows", () => {
    const bytes = packet();
    bytes[0] = 255;
    expect(() => decodeServerInfo(bytes)).toThrow(MalformedPacketError);
  });

  test("rejects an unknown gamemode ordinal", () => {
    expect(() => decodeServerInfo(packet({ mode: 99 }))).toThrow(/gamemode ordinal/);
  });

  test("rejects a negative player count", () => {
    expect(() => decodeServerInfo(packet({ players: -1 }))).toThrow(/player count/);
  });

  test("rejects an unreasonable player count", () => {
    expect(() => decodeServerInfo(packet({ players: 2_000_000 }))).toThrow(/player count/);
  });

  test("rejects a negative wave", () => {
    expect(() => decodeServerInfo(packet({ wave: -5 }))).toThrow(/wave/);
  });

  test("ignores metadata appended after the known packet fields", () => {
    const bytes = new Uint8Array([...packet(), 0, 0, 0]);
    expect(decodeServerInfo(bytes)).toEqual(decodeServerInfo(packet()));
  });

  test("consumes the unsigned port without exposing it", () => {
    // A server reporting a different port must not change anything the site
    // shows: the SRV result is the endpoint and the alias is the address.
    const decoded = decodeServerInfo(packet({ port: 65535 }));
    expect(decoded).not.toHaveProperty("port");
  });

  test("accepts a zero-length description", () => {
    expect(decodeServerInfo(packet({ description: "" })).description).toBe("");
  });
});
