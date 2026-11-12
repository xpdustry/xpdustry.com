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
    },
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
    copy: () => render().copy(),
  };
}

function fakeDocument(execCommand?: (command: string) => boolean) {
  const field = {
    value: "",
    readOnly: false,
    style: { cssText: "" },
    select: vi.fn(),
    setSelectionRange: vi.fn(),
    remove: vi.fn(),
  };
  const button = { focus: vi.fn() };
  const document = {
    activeElement: button,
    body: { append: vi.fn() },
    createElement: () => field,
    ...(execCommand && { execCommand: vi.fn(execCommand) }),
  };
  return { document, field, button };
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
      clipboard: { writeText: () => Promise.reject(new DOMException("No", "NotAllowedError")) },
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
        },
      },
    });
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
  });

  test("copies a selection when the clipboard API is missing", async () => {
    vi.stubGlobal("navigator", {});
    const { document, field, button } = fakeDocument(() => true);
    vi.stubGlobal("document", document);
    const copier = mount();

    await copier.copy();
    expect(field.value).toBe("hub.md.xpdustry.com");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(field.remove).toHaveBeenCalled();
    expect(button.focus).toHaveBeenCalled();
    expect(copier.state).toBe("copied");
  });

  test("says failed when the clipboard API is missing and the browser refuses the selection", async () => {
    vi.stubGlobal("navigator", {});
    const { document, field } = fakeDocument(() => false);
    vi.stubGlobal("document", document);
    const copier = mount();

    await copier.copy();
    expect(field.remove).toHaveBeenCalled();
    expect(copier.state).toBe("failed");
  });

  test("says failed when there is no way to copy at all", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", fakeDocument().document);
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
      clipboard: { writeText: () => new Promise<void>((resolve) => (accept = resolve)) },
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
