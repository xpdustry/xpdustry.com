import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCopy } from "./useCopy";

// The unit tests run without a DOM, so the hook runs on a stand-in for the three React hooks it
// uses: one component instance, rendered again on demand.
const react = vi.hoisted(() => {
  let slots: unknown[] = [];
  let cursor = 0;
  let cleanups: (() => void)[] = [];
  const slot = <T>(create: () => T): T => {
    const i = cursor++;
    if (!(i in slots)) slots[i] = create();
    return slots[i] as T;
  };
  return {
    render<T>(hook: () => T): T {
      cursor = 0;
      return hook();
    },
    unmount() {
      for (const cleanup of cleanups) cleanup();
      slots = [];
      cleanups = [];
    },
    useState<T>(initial: T) {
      const state = slot(() => ({ value: initial }));
      return [state.value, (value: T) => (state.value = value)] as const;
    },
    useRef: <T>(current: T) => slot(() => ({ current })),
    useEffect(effect: () => void | (() => void)) {
      slot(() => {
        const cleanup = effect();
        if (cleanup) cleanups.push(cleanup);
        return true;
      });
    }
  };
});
vi.mock("react", () => react);

function mount(text = "hub.md.xpdustry.com") {
  const render = () => react.render(() => useCopy(text));
  render();
  return {
    get state() {
      return render().state;
    },
    copy: () => render().copy()
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  react.unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useCopy", () => {
  test("says copied once the clipboard took the text, then goes back to idle", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const copier = mount();

    expect(copier.state).toBe("idle");
    const done = copier.copy();
    expect(writeText).toHaveBeenCalledWith("hub.md.xpdustry.com");
    expect(copier.state).toBe("idle");
    await done;
    expect(copier.state).toBe("copied");
    vi.advanceTimersByTime(2000);
    expect(copier.state).toBe("idle");
  });

  test("says failed when the write is rejected, and keeps saying it", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: () => Promise.reject(new DOMException("No", "NotAllowedError")) }
    });
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
    vi.advanceTimersByTime(60_000);
    expect(copier.state).toBe("failed");
  });

  test("says failed when the write throws before returning a promise", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: () => {
          throw new TypeError("Illegal invocation");
        }
      }
    });
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
  });

  test("says failed when the browser has no clipboard API", async () => {
    vi.stubGlobal("navigator", {});
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
  });

  test("a retry that works replaces a failure", async () => {
    const writeText = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new DOMException("No", "NotAllowedError"))
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
    await copier.copy();
    expect(copier.state).toBe("copied");
  });

  test("only the latest press decides what is shown", async () => {
    let refuse = () => {};
    const writeText = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(new Promise((_, reject) => (refuse = () => reject(new Error("late")))))
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const copier = mount();

    const first = copier.copy();
    await copier.copy();
    refuse();
    await first;
    expect(copier.state).toBe("copied");
  });

  test("a write that settles after unmounting changes nothing", async () => {
    let accept = () => {};
    vi.stubGlobal("navigator", {
      clipboard: { writeText: () => new Promise<void>((resolve) => (accept = resolve)) }
    });
    const copier = mount();
    const pending = copier.copy();
    react.unmount();
    accept();
    await pending;
    // A landed copy would have set a timer to go back to idle.
    expect(vi.getTimerCount()).toBe(0);
  });
});
