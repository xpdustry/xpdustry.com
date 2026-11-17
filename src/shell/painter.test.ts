import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";
import { FRAME_PAINTS, PAINT_NAMES } from "#app/textures/catalogue";
import { PAINTER } from "./painter";

class HTMLElement {
  dataset: Record<string, string>;
  children: HTMLElement[];
  constructor(
    paint?: string,
    public top = 20,
    children: HTMLElement[] = []
  ) {
    this.dataset = paint ? { paint } : {};
    this.children = children;
  }
  getBoundingClientRect() {
    return { top: this.top, bottom: this.top + 80 };
  }
  querySelectorAll() {
    return this.children;
  }
}

function browser({ sprites = [] as HTMLElement[] } = {}) {
  const rules: string[] = [];
  const observers: ((changes: { addedNodes: unknown[] }[]) => void)[] = [];
  const hired: Worker[] = [];
  class Worker {
    onmessage?: (event: { data: unknown }) => void;
    onerror?: () => void;
    posted: { key: string; priority: number }[] = [];
    terminate = vi.fn();
    constructor(
      public url: string,
      public options: unknown
    ) {
      hired.push(this);
    }
    postMessage = (message: { key: string; priority: number }) => this.posted.push(message);
  }
  class CSSStyleSheet {
    insertRule = (rule: string) => rules.push(rule);
  }
  class MutationObserver {
    constructor(callback: (typeof observers)[number]) {
      observers.push(callback);
    }
    observe() {}
  }
  const context = {
    document: {
      documentElement: { dataset: { painter: "/assets/painter.worker.js" } },
      adoptedStyleSheets: [] as unknown[],
      readyState: "complete",
      body: {},
      querySelectorAll: () => sprites
    },
    URL: { createObjectURL: (image: string) => `blob:${image}` },
    setTimeout: (run: () => void) => setTimeout(run, 0),
    Worker,
    CSSStyleSheet,
    MutationObserver,
    HTMLElement,
    addEventListener: vi.fn(),
    innerHeight: 800,
    paints: undefined as ((key: string) => Promise<string | undefined>) | undefined
  };
  return {
    context,
    rules,
    hired,
    answer: (key: string, image?: string) => hired.at(-1)!.onmessage!({ data: { key, image } }),
    add: (...nodes: unknown[]) => observers[0]!([{ addedNodes: nodes }])
  };
}

const sprites = (worker: { posted: { key: string; priority: number }[] }) =>
  worker.posted
    .filter(({ key }) => key.startsWith("blob"))
    .map(({ key, priority }) => [key, priority]);

describe("inline painter", () => {
  test("starts one worker and asks it for the named textures, the frame first, then each sprite once: those on show, their grown ones, those below", () => {
    const page = browser({
      sprites: [
        new HTMLElement("blob_a_1"),
        new HTMLElement("blob_a_0"),
        new HTMLElement("blob_b_0", 1200),
        new HTMLElement("blob_a_0")
      ]
    });
    runInNewContext(PAINTER, page.context);
    const [worker] = page.hired;
    expect(page.hired).toHaveLength(1);
    expect(worker!.url).toMatch(/painter\.worker/);
    expect(
      worker!.posted.filter(({ key }) => !key.startsWith("blob")).map(({ key }) => key)
    ).toEqual(PAINT_NAMES);
    const urgent = worker!.posted.filter(({ priority }) => priority === 0);
    expect(new Set(urgent.map(({ key }) => key))).toEqual(new Set(FRAME_PAINTS));
    expect(sprites(worker!)).toEqual([
      ["blob_a_1", 3],
      ["blob_a_0", 1],
      ["blob_b_0", 4]
    ]);
  });

  test("asks for the sprites a later page brings, and never twice", () => {
    const page = browser({ sprites: [new HTMLElement("blob_a_0")] });
    runInNewContext(PAINTER, page.context);
    page.add(
      new HTMLElement(undefined, 20, [new HTMLElement("blob_c_0"), new HTMLElement("blob_a_0")]),
      {}
    );
    page.add(new HTMLElement("blob_d_1"));
    expect(sprites(page.hired[0]!)).toEqual([
      ["blob_a_0", 1],
      ["blob_c_0", 1],
      ["blob_d_1", 3]
    ]);
  });

  test("a texture that could not be painted is absent, and holds nothing", async () => {
    const { context, rules, answer } = browser();
    runInNewContext(PAINTER, context);
    const ridge = context.paints!("ridge");
    answer("ridge");
    expect(await ridge).toBeUndefined();
    expect(rules).toEqual([]);
  });

  test("replaces a failing worker, asks the next for what is still waited on, and gives up after the third", async () => {
    const page = browser({ sprites: [new HTMLElement("blob_a_0")] });
    runInNewContext(PAINTER, page.context);
    page.answer("crown", "crown.png");
    page.hired[0]!.onerror!();
    const late = page.context.paints!("blob_late_0");
    await vi.waitFor(() => expect(page.hired).toHaveLength(2));
    expect(page.hired[0]!.terminate).toHaveBeenCalled();
    const again = page.hired[1]!.posted.map(({ key }) => key);
    expect(again).not.toContain("crown");
    expect(again).toEqual(expect.arrayContaining(["ridge", "blob_a_0", "blob_late_0"]));
    page.answer("blob_late_0", "late.png");
    expect(await late).toBe("blob:late.png");

    const ridge = page.context.paints!("ridge");
    page.hired[1]!.onerror!();
    await vi.waitFor(() => expect(page.hired).toHaveLength(3));
    page.hired[2]!.onerror!();
    expect(await ridge).toBeUndefined();
    expect(await page.context.paints!("blob_later_0")).toBeUndefined();
    await new Promise((done) => setTimeout(done, 5));
    expect(page.hired).toHaveLength(3);
  });
});
