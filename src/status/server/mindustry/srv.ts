export interface SrvRecord {
  name: string;
  port: number;
  priority: number;
  weight: number;
}

export interface Endpoint {
  hostname: string;
  port: number;
}

const SERVICE_NOT_OFFERED = new Set(["", "."]);

export function isUsableSrvRecord(record: SrvRecord): boolean {
  return (
    !SERVICE_NOT_OFFERED.has(record.name) &&
    isUint16(record.port) &&
    record.port > 0 &&
    isUint16(record.priority) &&
    isUint16(record.weight)
  );
}

function isUint16(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 65_535;
}

export function inTheGamesOrder(records: readonly SrvRecord[]): Endpoint[] {
  return [...records]
    .sort((a, b) => a.priority - b.priority || a.weight - b.weight)
    .map((record) => ({ hostname: record.name, port: record.port }));
}
