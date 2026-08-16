import { describe, expect, test, vi } from "vitest";
import { Poller, type PollerClock } from "#app/server/poller";

/** A clock whose timers only fire when the test says so. */
function fakeClock() {
  let next = 1;
  const pending = new Map<number, { handler: () => void; ms: number }>();
  const clock: PollerClock = {
    setTimeout: (handler, ms) => {
      const handle = next++;
      pending.set(handle, { handler, ms });
      return handle;
    },
    clearTimeout: (handle) => {
      pending.delete(handle as number);
    },
  };
  return {
    clock,
    get scheduled() {
      return [...pending.values()].map((entry) => entry.ms);
    },
    fire() {
      const [handle, entry] = [...pending.entries()][0] ?? [];
      if (handle === undefined || !entry) throw new Error("nothing scheduled");
      pending.delete(handle);
      entry.handler();
    },
  };
}

describe("Poller", () => {
  test("runs a cycle immediately on start", () => {
    const run = vi.fn(async () => {});
    const { clock } = fakeClock();
    new Poller({ intervalMs: 1000, run, clock }).start();
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("schedules the next cycle at the configured interval", async () => {
    const run = vi.fn(async () => {});
    const timers = fakeClock();
    new Poller({ intervalMs: 30_000, run, clock: timers.clock }).start();
    await vi.waitFor(() => expect(timers.scheduled).toEqual([30_000]));

    timers.fire();
    expect(run).toHaveBeenCalledTimes(2);
  });

  test("starts the interval only after a cycle finishes, so cycles cannot overlap", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const run = vi.fn(() => gate);
    const timers = fakeClock();

    new Poller({ intervalMs: 1000, run, clock: timers.clock }).start();
    expect(run).toHaveBeenCalledTimes(1);
    expect(timers.scheduled).toEqual([]);

    release();
    await vi.waitFor(() => expect(timers.scheduled).toEqual([1000]));
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("start is idempotent", () => {
    const run = vi.fn(async () => {});
    const { clock } = fakeClock();
    const poller = new Poller({ intervalMs: 1000, run, clock });
    poller.start();
    poller.start();
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("stop clears the pending timer", async () => {
    const timers = fakeClock();
    const poller = new Poller({
      intervalMs: 1000,
      run: async () => {},
      clock: timers.clock,
    });
    poller.start();
    await vi.waitFor(() => expect(timers.scheduled).toEqual([1000]));

    poller.stop();
    expect(timers.scheduled).toEqual([]);
    expect(poller.started).toBe(false);
  });

  test("stop aborts the in-flight cycle", async () => {
    let seen: AbortSignal | undefined;
    const poller = new Poller({
      intervalMs: 1000,
      run: (signal) => {
        seen = signal;
        return new Promise<void>(() => {});
      },
      clock: fakeClock().clock,
    });
    poller.start();
    expect(seen?.aborted).toBe(false);

    poller.stop();
    expect(seen?.aborted).toBe(true);
  });

  test("a cycle that finishes after stop does not schedule another", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const timers = fakeClock();
    const poller = new Poller({
      intervalMs: 1000,
      run: () => gate,
      clock: timers.clock,
    });

    poller.start();
    poller.stop();
    release();
    await gate;
    expect(timers.scheduled).toEqual([]);
  });

  test("reports a failed cycle and keeps going", async () => {
    const onError = vi.fn();
    const timers = fakeClock();
    new Poller({
      intervalMs: 1000,
      run: async () => {
        throw new Error("upstream down");
      },
      onError,
      clock: timers.clock,
    }).start();

    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(timers.scheduled).toEqual([1000]);
  });
});
