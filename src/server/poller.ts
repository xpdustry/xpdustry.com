/**
 * Keeps one value fresh in the background: fetched on start, then every `intervalMs`.
 *
 * Readers never wait on the network; they get the last good value, or `undefined` before the
 * first fetch lands. A failed refresh keeps the last value and is retried on the next tick.
 */
export interface PollerOptions<T> {
  name: string;
  intervalMs: number;
  load: (signal: AbortSignal) => Promise<T>;
  /** Abort a refresh that takes longer than this. */
  timeoutMs?: number;
}

export interface PollerHealth {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
}

export class Poller<T> {
  readonly #options: PollerOptions<T>;
  #value: T | undefined;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #controller: AbortController | undefined;
  #lastAttemptAt: string | null = null;
  #lastSuccessAt: string | null = null;

  constructor(options: PollerOptions<T>) {
    this.#options = options;
  }

  get value(): T | undefined {
    return this.#value;
  }

  get health(): PollerHealth {
    return { lastAttemptAt: this.#lastAttemptAt, lastSuccessAt: this.#lastSuccessAt };
  }

  start(): void {
    if (this.#controller) return;
    this.#controller = new AbortController();
    void this.#tick(this.#controller.signal);
  }

  stop(): void {
    this.#controller?.abort();
    this.#controller = undefined;
    clearTimeout(this.#timer);
  }

  /** Fetches once, now. The scheduled refreshes are unaffected. */
  async refresh(signal?: AbortSignal): Promise<void> {
    const { name, load, timeoutMs = 10_000 } = this.#options;
    this.#lastAttemptAt = new Date().toISOString();
    const timeout = AbortSignal.timeout(timeoutMs);
    try {
      this.#value = await load(signal ? AbortSignal.any([signal, timeout]) : timeout);
      this.#lastSuccessAt = new Date().toISOString();
    } catch (error) {
      if (signal?.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[${name}] refresh failed: ${message}`);
    }
  }

  async #tick(signal: AbortSignal): Promise<void> {
    await this.refresh(signal);
    if (signal.aborted) return;
    this.#timer = setTimeout(() => void this.#tick(signal), this.#options.intervalMs);
    this.#timer.unref();
  }
}
