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
    const selected = pickByWeight(remaining, random());
    ordered.push(selected);
    remaining.splice(remaining.indexOf(selected), 1);
  }
  return ordered;
}

// RFC 2782's weighted selection, page 3: https://www.rfc-editor.org/rfc/rfc2782
function pickByWeight(records: readonly SrvRecord[], unit: number): SrvRecord {
  if (!(unit >= 0 && unit < 1)) throw new RangeError(`random() gave ${unit}, outside [0, 1)`);
  const selectionOrder = [...records].sort(zeroWeightFirst);
  const totalWeight = selectionOrder.reduce((sum, record) => sum + record.weight, 0);
  if (totalWeight === 0) return selectionOrder[Math.floor(unit * selectionOrder.length)];

  const draw = Math.floor(unit * (totalWeight + 1));
  let runningWeight = 0;
  for (const record of selectionOrder.slice(0, -1)) {
    runningWeight += record.weight;
    if (runningWeight >= draw) return record;
  }
  return selectionOrder[selectionOrder.length - 1];
}

function zeroWeightFirst(left: SrvRecord, right: SrvRecord): number {
  return Number(left.weight !== 0) - Number(right.weight !== 0);
}
