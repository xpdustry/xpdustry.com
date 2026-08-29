import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, test } from "vitest";

const root = process.cwd();
const handlerPath = pathToFileURL(resolve(root, "dist/server/index.js")).href;
const manifestPath = resolve(root, "dist/client/.vite/manifest.json");

let html: string;
let clientEntry: string;

const execFileAsync = promisify(execFile);

beforeAll(async () => {
  const source = `const { handleRequest } = await import(${JSON.stringify(handlerPath)}); const response = await handleRequest(new Request("https://www.xpdustry.com/")); process.stdout.write(await response.text());`;
  const result = await execFileAsync(process.execPath, ["--input-type=module", "--eval", source], {
    encoding: "utf8",
    env: { ...process.env, XPD_DISABLE_STATUS: "1" },
  });
  html = result.stdout;
  clientEntry = await readClientEntry();
});

describe("built hydration", () => {
  test("preserves server state and attaches shell controls", async () => {
    localStorage.clear();
    installMatchMedia(false);
    document.open();
    document.write(html);
    document.close();
    runInlineScripts();
    expect(document.body.textContent?.match(/Checking…/g)).toHaveLength(7);

    await import(clientEntry);
    await settled();
    expect(document.body.textContent?.match(/Checking…/g)).toHaveLength(7);

    const theme = document.querySelector<HTMLButtonElement>(
      'button[title="Switch to the dark theme"]',
    );
    if (!theme) throw new Error("theme control did not render");
    theme.click();
    await settled();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("xpdustry-theme")).toBe("dark");

    const menu = document.querySelector<HTMLButtonElement>('[aria-controls="site-drawer"]');
    if (!menu) throw new Error("menu control did not render");
    menu.click();
    await settled();

    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector("#site-drawer")).not.toBeNull();
  });
});

async function readClientEntry(): Promise<string> {
  const manifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  const key = "virtual:solid-ssr-entry-client.tsx";
  if (typeof manifest !== "object" || manifest === null || !(key in manifest)) {
    throw new Error("client entry is absent from the build manifest");
  }

  const entry = manifest[key];
  if (typeof entry !== "object" || entry === null || !("file" in entry)) {
    throw new Error("client manifest entry is invalid");
  }
  if (typeof entry.file !== "string") throw new Error("client entry path is invalid");
  return pathToFileURL(resolve(root, "dist/client", entry.file)).href;
}

function installMatchMedia(matches: boolean): void {
  const media: MediaQueryList = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => media,
  });
}

function runInlineScripts(): void {
  for (const script of document.querySelectorAll<HTMLScriptElement>("script:not([src])")) {
    if (script.type !== "" && script.type !== "text/javascript") continue;
    window.eval(script.textContent ?? "");
  }
}

async function settled(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
