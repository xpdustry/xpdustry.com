// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCopy } from "./useCopy";

let root: Root | undefined;
let copier: ReturnType<typeof useCopy>;

function Probe({ text, onRender }: { text: string; onRender: (copy: typeof copier) => void }) {
  onRender(useCopy(text));
  return null;
}

function mount(text = "hub.md.xpdustry.com") {
  root = createRoot(document.createElement("div"));
  act(() => root!.render(<Probe text={text} onRender={(rendered) => (copier = rendered)} />));
  return {
    get state() {
      return copier.state;
    },
    copy: () => act(() => copier.copy())
  };
}

function unmount() {
  act(() => root?.unmount());
  root = undefined;
}

const clipboard = (writeText: (text: string) => Promise<void>) =>
  vi.stubGlobal("navigator", { clipboard: { writeText } });
const elapse = (ms: number) =>
  act(async () => {
    vi.advanceTimersByTime(ms);
  });
const refusal = () => Promise.reject(new DOMException("No", "NotAllowedError"));

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
});
afterEach(() => {
  unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useCopy", () => {
  test("puts the text on the clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);

    await mount().copy();

    expect(writeText).toHaveBeenCalledWith("hub.md.xpdustry.com");
  });

  test("says copied once the clipboard took the text, then goes back to idle", async () => {
    const write = Promise.withResolvers<void>();
    clipboard(() => write.promise);
    const copier = mount();

    expect(copier.state).toBe("idle");
    const done = copier.copy();
    expect(copier.state).toBe("idle");
    write.resolve();
    await done;
    expect(copier.state).toBe("copied");
    await elapse(2000);
    expect(copier.state).toBe("idle");
  });

  test("says failed when the write is refused, and keeps saying it", async () => {
    clipboard(refusal);
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
    await elapse(60_000);
    expect(copier.state).toBe("failed");
  });

  test.each([
    [
      "throws before returning a promise",
      {
        clipboard: {
          writeText: () => {
            throw new TypeError("Illegal invocation");
          }
        }
      }
    ],
    ["has no clipboard API", {}]
  ])("says failed when the browser %s", async (_label, navigator) => {
    vi.stubGlobal("navigator", navigator);
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
  });

  test("a retry that works replaces a failure", async () => {
    clipboard(vi.fn<() => Promise<void>>().mockImplementationOnce(refusal).mockResolvedValueOnce());
    const copier = mount();

    await copier.copy();
    expect(copier.state).toBe("failed");
    await copier.copy();
    expect(copier.state).toBe("copied");
  });

  test("only the latest press decides what is shown", async () => {
    const first = Promise.withResolvers<void>();
    clipboard(
      vi.fn<() => Promise<void>>().mockReturnValueOnce(first.promise).mockResolvedValueOnce()
    );
    const copier = mount();

    const pressed = copier.copy();
    await copier.copy();
    first.reject(new Error("late"));
    await pressed;
    expect(copier.state).toBe("copied");
  });

  test("a write that lands after unmounting leaves nothing behind", async () => {
    const write = Promise.withResolvers<void>();
    clipboard(() => write.promise);
    const copier = mount();

    const pending = copier.copy();
    unmount();
    write.resolve();
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
});
