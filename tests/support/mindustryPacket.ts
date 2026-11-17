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

/**
 * A Mindustry server's answer to a discovery ping: strings prefixed by their byte length,
 * big-endian 32-bit integers, a gamemode byte and a 16-bit port, in the order the game writes them.
 */
export function serverInfoPacket(overrides: Partial<PacketFields> = {}): Uint8Array {
  const fields = { ...PACKET_FIELDS, ...overrides };
  const bytes: number[] = [];
  const string = (value: string) => {
    const encoded = new TextEncoder().encode(value);
    bytes.push(encoded.length, ...encoded);
  };
  const i32 = (value: number) => {
    bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  };

  string(fields.name);
  string(fields.map);
  i32(fields.players);
  i32(fields.wave);
  i32(fields.version);
  string(fields.versionType);
  bytes.push(fields.mode);
  i32(fields.playerLimit);
  string(fields.description);
  string(fields.modeName);
  bytes.push((fields.port >> 8) & 0xff, fields.port & 0xff);
  return Uint8Array.from(bytes);
}
