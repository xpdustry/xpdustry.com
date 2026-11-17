import type { ServerInfo } from "../../snapshots";
import { stripMindustryMarkup } from "./markup";

const FRAMEWORK_MESSAGE = 0xfe;
const DISCOVER_HOST = 0x01;
export const QUERY_PACKET = Uint8Array.from([FRAMEWORK_MESSAGE, DISCOVER_HOST]);

const GAMEMODE_BY_ORDINAL = ["survival", "sandbox", "attack", "pvp", "editor"] as const;
const UNKNOWN_GAMEMODE = GAMEMODE_BY_ORDINAL[0];

export class MalformedPacketError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MalformedPacketError";
  }
}

export class TruncatedPacketError extends MalformedPacketError {
  constructor(field: string) {
    super(`packet ended while reading ${field}, where the game would read zeros`);
    this.name = "TruncatedPacketError";
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
      throw new TruncatedPacketError(what);
    }
    const at = this.#offset;
    this.#offset += length;
    return at;
  }

  u8(what: string): number {
    return this.#view.getUint8(this.#take(1, what));
  }

  i8(what: string): number {
    return this.#view.getInt8(this.#take(1, what));
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

export function decodeServerInfo(packet: Uint8Array): ServerInfo {
  const reader = new Reader(packet);

  const name = reader.string("name");
  const map = reader.string("map");
  const players = reader.i32("players");
  const wave = reader.i32("wave");
  const version = reader.i32("version");
  const versionType = reader.string("version type");
  const mode = gamemode(reader.i8("mode"));
  const playerLimit = reader.i32("player limit");
  const description = reader.string("description");
  const modeName = reader.string("mode name");
  reader.u16("port");

  return {
    name: stripMindustryMarkup(name),
    description: stripMindustryMarkup(description),
    map: stripMindustryMarkup(map),
    mode: modeName === "" ? mode : stripMindustryMarkup(modeName),
    players,
    playerLimit,
    wave,
    version,
    versionType: stripMindustryMarkup(versionType)
  };
}

function gamemode(ordinal: number): string {
  if (ordinal < 0) throw new MalformedPacketError("gamemode ordinal is negative");
  return GAMEMODE_BY_ORDINAL[ordinal] ?? UNKNOWN_GAMEMODE;
}
