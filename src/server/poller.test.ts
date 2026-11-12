import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Poller } from "#app/server/poller";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("loads at once, then again an interval after each load finishes", async () => {
  const load = vi.fn(async () => load.mock.calls.length);
  const poller = new Poller({ name: "test", intervalMs: 1_000, load });

  poller.start();
  poller.start();
  await vi.advanceTimersByTimeAsync(0);
  expect(load).toHaveBeenCalledOnce();
  expect(poller.value).toBe(1);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(poller.value).toBe(2);
  poller.stop();
});

test("a failed load keeps the last value and is retried", async () => {
  const load = vi
    .fn<() => Promise<string>>()
    .mockResolvedValueOnce("good")
    .mockRejectedValueOnce(new Error("down"))
    .mockResolvedValueOnce("back");
  const poller = new Poller({ name: "test", intervalMs: 1_000, load });

  poller.start();
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(poller.value).toBe("good");
  expect(poller.health.lastSuccessAt).not.toBe(poller.health.lastAttemptAt);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(poller.value).toBe("back");
  poller.stop();
});

test("stop aborts the load in flight and schedules nothing more", async () => {
  let signal: AbortSignal | undefined;
  const load = vi.fn((active: AbortSignal) => {
    signal = active;
    return new Promise<string>(() => {});
  });
  const poller = new Poller({ name: "test", intervalMs: 1_000, load });

  poller.start();
  expect(signal?.aborted).toBe(false);
  poller.stop();
  expect(signal?.aborted).toBe(true);

  await vi.advanceTimersByTimeAsync(5_000);
  expect(load).toHaveBeenCalledOnce();
  expect(poller.value).toBeUndefined();
});
