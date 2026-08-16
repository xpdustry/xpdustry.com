/**
 * A repeating job that never overlaps itself.
 *
 * The next tick is scheduled when the previous one finishes, so a cycle that
 * runs long delays the next rather than stacking on top of it. Timers and the
 * clock are injected so the scheduling tests run without waiting in real time.
 */

export interface PollerClock {
  setTimeout: (handler: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

const SYSTEM_CLOCK: PollerClock = {
  setTimeout: (handler, ms) => setTimeout(handler, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** What a polled service reports about itself, for `/healthz`. */
export interface ServiceHealth {
  state: "loading" | "ready" | "unavailable";
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
}

export interface PollerOptions {
  /** Milliseconds between the end of one cycle and the start of the next. */
  intervalMs: number;
  /** One cycle. Rejections are reported and swallowed; the poller keeps going. */
  run: (signal: AbortSignal) => Promise<void>;
  onError?: (error: unknown) => void;
  clock?: PollerClock;
}

export class Poller {
  #options: PollerOptions;
  #clock: PollerClock;
  #timer: unknown = null;
  #controller: AbortController | null = null;
  #started = false;

  constructor(options: PollerOptions) {
    this.#options = options;
    this.#clock = options.clock ?? SYSTEM_CLOCK;
  }

  get started(): boolean {
    return this.#started;
  }

  /** Runs one cycle immediately, then keeps cycling. Calling twice is a no-op. */
  start(): void {
    if (this.#started) return;
    this.#started = true;
    void this.#cycle();
  }

  /** Clears the pending timer and aborts the in-flight cycle. */
  stop(): void {
    if (!this.#started) return;
    this.#started = false;
    if (this.#timer !== null) {
      this.#clock.clearTimeout(this.#timer);
      this.#timer = null;
    }
    this.#controller?.abort();
    this.#controller = null;
  }

  async #cycle(): Promise<void> {
    const controller = new AbortController();
    this.#controller = controller;

    try {
      await this.#options.run(controller.signal);
    } catch (error) {
      if (this.#started) this.#options.onError?.(error);
    } finally {
      if (this.#controller === controller) this.#controller = null;
    }

    // A stop() during the cycle must not schedule another one.
    if (!this.#started) return;
    this.#timer = this.#clock.setTimeout(() => {
      this.#timer = null;
      void this.#cycle();
    }, this.#options.intervalMs);
  }
}
