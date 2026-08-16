/**
 * The Mindustry UDP status protocol.
 *
 * A query is two bytes; the reply is a fixed sequence of length-prefixed UTF-8
 * strings and big-endian integers. Every field is bounds-checked here, because
 * the bytes come from a machine nobody on this side controls: a truncated or
 * lying packet must fail the read, never index past the buffer.
 */

import * as v from "valibot";
import { stripMindustryMarkup } from "#app/server/mindustry-markup";

/** Framework message, then the discover-host opcode. */
export const QUERY_PACKET = Uint8Array.from([0xfe, 0x01]);

/** Mindustry's `Gamemode` ordinals, in declaration order. */
const GAMEMODES = ["survival", "sandbox", "attack", "pvp", "editor"] as const;

/**
 * Writers cap these at 100/64/32/100/50 bytes. Reading with a little headroom
 * rejects nonsense without failing a server that pads slightly differently.
 */
const MAX_STRING_BYTES = 256;

/** Above this a count is a lie or a misaligned read, not a big server. */
const MAX_PLAYERS = 1_000_000;

export interface ServerInfo {
  name: string;
  description: string;
  map: string;
  mode: string;
  players: number;
  playerLimit: number;
  wave: number;
  version: number;
  versionType: string;
}

export const rawServerInfoSchema = v.object({
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

export type RawServerInfo = v.InferOutput<typeof rawServerInfoSchema>;

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

  i16(what: string): number {
    return this.#view.getInt16(this.#take(2, what), false);
  }

  /** One unsigned length byte, then that many UTF-8 bytes. */
  string(what: string): string {
    const length = this.u8(`${what} length`);
    if (length > MAX_STRING_BYTES) {
      throw new MalformedPacketError(`${what} claims ${length} bytes`);
    }
    const at = this.#take(length, what);
    return new TextDecoder("utf-8").decode(this.#bytes.subarray(at, at + length));
  }
}

/**
 * Decodes a status reply. Strings come back with Mindustry's colour markup
 * removed; they are still untrusted text and must reach the page as text
 * nodes, never as HTML.
 */
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

  // The trailing port is the server's own listening port. It is consumed and
  // validated so a short packet fails, then discarded: the site queries the
  // SRV target and shows the friendly alias, so a server cannot redirect us
  // by reporting a different port.
  const port = reader.i16("port") & 0xffff;

  // Trailing bytes mean the packet is not the shape this decoder knows. A
  // newer protocol appending fields would land here, and guessing at a format
  // is worse than reporting the server offline.
  if (reader.remaining > 0) {
    throw new MalformedPacketError(`${reader.remaining} unexpected trailing bytes`);
  }

  const raw = validateRawServerInfo({
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

  // A custom mode names itself; otherwise the ordinal names it.
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

function validateRawServerInfo(value: RawServerInfo): RawServerInfo {
  try {
    return v.parse(rawServerInfoSchema, value);
  } catch (error) {
    if (v.isValiError(error)) {
      throw new MalformedPacketError(v.summarize(error.issues), { cause: error });
    }
    throw error;
  }
}
