export interface PacketFields {
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
}

const PACKET_FIELDS: PacketFields = {
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
  port: 6567
};

const GAME_BYTE_BUDGET = { name: 100, map: 64, versionType: 32, description: 100, modeName: 50 };

class PacketWriter {
  readonly bytes: number[] = [];

  string(value: string, budget = 255) {
    const encoded = new TextEncoder().encode(value).subarray(0, budget);
    this.bytes.push(encoded.length, ...encoded);
  }

  i32(value: number) {
    this.bytes.push(
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    );
  }

  u8(value: number) {
    this.bytes.push(value & 0xff);
  }

  u16(value: number) {
    this.bytes.push((value >> 8) & 0xff, value & 0xff);
  }
}

function write(fields: PacketFields, budget: Partial<typeof GAME_BYTE_BUDGET>): Uint8Array {
  const out = new PacketWriter();
  out.string(fields.name, budget.name);
  out.string(fields.map, budget.map);
  out.i32(fields.players);
  out.i32(fields.wave);
  out.i32(fields.version);
  out.string(fields.versionType, budget.versionType);
  out.u8(fields.mode);
  out.i32(fields.playerLimit);
  out.string(fields.description, budget.description);
  out.string(fields.modeName, budget.modeName);
  out.u16(fields.port);
  return Uint8Array.from(out.bytes);
}

export function serverInfoPacket(overrides: Partial<PacketFields> = {}): Uint8Array {
  return write({ ...PACKET_FIELDS, ...overrides }, GAME_BYTE_BUDGET);
}

export function packetClaimingLongerName(): Uint8Array {
  const bytes = serverInfoPacket();
  bytes[0] = 255;
  return bytes;
}
