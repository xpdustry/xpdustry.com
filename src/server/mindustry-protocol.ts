import * as v from "valibot";
import type { ServerInfo } from "#app/data/snapshots";
import { stripMindustryMarkup } from "#app/server/mindustry-markup";

/** Framework message, then the discover-host opcode. */
export const QUERY_PACKET = Uint8Array.from([0xfe, 0x01]);

/** Mindustry's `Gamemode` ordinals, in declaration order. */
const GAMEMODES = ["survival", "sandbox", "attack", "pvp", "editor"] as const;

const MAX_PLAYERS = 1_000_000;

export const RawServerInfoSchema = v.object({
  name: v.string(),
  description: v.string(),
  map: v.string(),
  modeOrdinal: v.pipe(
    v.number(),
    v.integer("gamemode ordinal must be an integer"),
    v.minValue(0, "gamemode ordinal is out of range"),
    v.maxValue(GAMEMODES.length - 1, "gamemode ordinal is out of range"),
  ),
  modeName: v.string(),
  players: v.pipe(
    v.number(),
    v.integer("player count must be an integer"),
    v.minValue(0, "player count is out of range"),
    v.maxValue(MAX_PLAYERS, "player count is out of range"),
  ),
  playerLimit: v.pipe(
    v.number(),
    v.integer("player limit must be an integer"),
    v.minValue(0, "player limit is out of range"),
    v.maxValue(MAX_PLAYERS, "player limit is out of range"),
  ),
  wave: v.pipe(v.number(), v.integer(), v.minValue(0, "wave is out of range")),
  version: v.pipe(v.number(), v.integer()),
  versionType: v.string(),
  port: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(65535)),
});

export type RawServerInfo = v.InferOutput<typeof RawServerInfoSchema>;

export class MalformedPacketError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MalformedPacketError";
  }
}

class Reader {
  #view: DataView;
  #bytes: Uint8Array;
  #offset = 0;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get remaining(): number {
    return this.#bytes.byteLength - this.#offset;
  }

  #take(length: number, what: string): number {
    if (length < 0 || this.remaining < length) {
      throw new MalformedPacketError(`packet ended while reading ${what}`);
    }
    const at = this.#offset;
    this.#offset += length;
    return at;
  }

  u8(what: string): number {
    return this.#view.getUint8(this.#take(1, what));
  }

  i32(what: string): number {
    return this.#view.getInt32(this.#take(4, what), false);
  }

  u16(what: string): number {
    return this.#view.getUint16(this.#take(2, what), false);
  }

  string(what: string): string {
    const length = this.u8(`${what} length`);
    const at = this.#take(length, what);
    return new TextDecoder("utf-8").decode(this.#bytes.subarray(at, at + length));
  }
}

/** Removes Mindustry markup but does not make strings safe for HTML injection. */
export function decodeServerInfo(packet: Uint8Array): ServerInfo {
  const reader = new Reader(packet);

  const name = reader.string("name");
  const map = reader.string("map");
  const players = reader.i32("players");
  const wave = reader.i32("wave");
  const version = reader.i32("version");
  const versionType = reader.string("version type");
  const modeOrdinal = reader.u8("mode");
  const playerLimit = reader.i32("player limit");
  const description = reader.string("description");
  const modeName = reader.string("mode name");
  const port = reader.u16("port");

  const raw = parseRawServerInfo({
    name,
    description,
    map,
    modeOrdinal,
    modeName,
    players,
    playerLimit,
    wave,
    version,
    versionType,
    port,
  });

  const mode =
    raw.modeName === "" ? GAMEMODES[raw.modeOrdinal] : stripMindustryMarkup(raw.modeName);

  return {
    name: stripMindustryMarkup(raw.name),
    description: stripMindustryMarkup(raw.description),
    map: stripMindustryMarkup(raw.map),
    mode,
    players: raw.players,
    playerLimit: raw.playerLimit,
    wave: raw.wave,
    version: raw.version,
    versionType: stripMindustryMarkup(raw.versionType),
  };
}

function parseRawServerInfo(value: unknown): RawServerInfo {
  const result = v.safeParse(RawServerInfoSchema, value);
  if (result.success) return result.output;
  throw new MalformedPacketError(v.summarize(result.issues));
}
