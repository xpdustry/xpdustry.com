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

/** The fields of an SRV record are 16-bit; a target of "." says the service is not offered. */
export function isUsableSrvRecord(record: SrvRecord): boolean {
  return (
    record.name !== "" &&
    record.name !== "." &&
    isUint16(record.port) &&
    record.port > 0 &&
    isUint16(record.priority) &&
    isUint16(record.weight)
  );
}

function isUint16(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 65_535;
}

/** The order RFC 2782 asks for: lowest priority first, then by weighted lottery within each. */
export function orderSrvEndpoints(records: readonly SrvRecord[], random: () => number): Endpoint[] {
  const priorities = [...new Set(records.map((record) => record.priority))].sort((a, b) => a - b);
  return priorities.flatMap((priority) =>
    weightedOrder(
      records.filter((record) => record.priority === priority),
      random
    ).map((record) => ({ hostname: record.name, port: record.port }))
  );
}

function weightedOrder(records: readonly SrvRecord[], random: () => number): SrvRecord[] {
  const remaining = [...records];
  const ordered: SrvRecord[] = [];
  while (remaining.length > 0) {
    const selected = pickByWeight(remaining, unitInterval(random()));
    ordered.push(selected);
    remaining.splice(remaining.indexOf(selected), 1);
  }
  return ordered;
}

/** A roll held inside [0, 1), so a faulty source of randomness cannot pick past the last record. */
function unitInterval(value: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1 - Number.EPSILON) : 0;
}

/**
 * Records of weight 0 come first and each record owns a run of the total weight as long as its own;
 * the roll lands in one of them. When no record has weight, each is as likely as the others.
 */
function pickByWeight(records: readonly SrvRecord[], unit: number): SrvRecord {
  const selectionOrder = [...records].sort(zeroWeightFirst);
  const totalWeight = selectionOrder.reduce((sum, record) => sum + record.weight, 0);
  if (totalWeight === 0) return selectionOrder[Math.floor(unit * selectionOrder.length)];

  const draw = Math.floor(unit * (totalWeight + 1));
  let runningWeight = 0;
  for (const record of selectionOrder) {
    runningWeight += record.weight;
    if (runningWeight >= draw) return record;
  }
  return selectionOrder[selectionOrder.length - 1];
}

function zeroWeightFirst(left: SrvRecord, right: SrvRecord): number {
  return Number(left.weight !== 0) - Number(right.weight !== 0);
}
