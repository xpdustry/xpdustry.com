const PACKET_FIELDS = {
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

/** A string as the game writes it: a length byte, then UTF-8 cut to the field's byte budget. */
const text = (value: string, budget: number) => {
  const encoded = Buffer.from(value).subarray(0, budget);
  return Buffer.concat([Buffer.of(encoded.length), encoded]);
};

const int = (bytes: 2 | 4, value: number) => {
  const out = Buffer.alloc(bytes);
  if (bytes === 4) out.writeInt32BE(value);
  else out.writeUInt16BE(value);
  return out;
};

/** A server's answer to a discovery ping, the way the game's writeServerData lays it out. */
export function serverInfoPacket(overrides: Partial<typeof PACKET_FIELDS> = {}): Uint8Array {
  const fields = { ...PACKET_FIELDS, ...overrides };
  return Uint8Array.from(
    Buffer.concat([
      text(fields.name, 100),
      text(fields.map, 64),
      int(4, fields.players),
      int(4, fields.wave),
      int(4, fields.version),
      text(fields.versionType, 32),
      Buffer.of(fields.mode),
      int(4, fields.playerLimit),
      text(fields.description, 100),
      text(fields.modeName, 50),
      int(2, fields.port)
    ])
  );
}
