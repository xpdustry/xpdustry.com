import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test } from "vitest";
import { ServerCard } from "#app/components/content/ServerCard";
import type { ServerInfo, ServerSnapshotItem } from "#app/data/snapshots";

const identity = {
  slug: "survival",
  label: "Survival",
  hostname: "survival.md.xpdustry.com",
};

const info = {
  name: "Survival",
  description: "",
  map: "Fungal Pass",
  mode: "survival",
  players: 27,
  playerLimit: 50,
  wave: 142,
  version: 159,
  versionType: "official",
} satisfies ServerInfo;

afterEach(cleanup);

describe("<ServerCard />", () => {
  test.each([
    [
      "polling",
      { ...identity, status: "polling" } satisfies ServerSnapshotItem,
      "Checking…",
      "Waiting for the first status poll",
    ],
    [
      "offline",
      { ...identity, status: "offline" } satisfies ServerSnapshotItem,
      "Offline",
      "No response from this server",
    ],
    [
      "online",
      { ...identity, status: "online", info } satisfies ServerSnapshotItem,
      "27 / 50",
      "Fungal Pass",
    ],
  ])("renders the %s state", (_state, server, status, detail) => {
    render(() => <ServerCard server={server} />);

    expect(screen.getByText(status)).toBeInTheDocument();
    expect(screen.getByText(detail)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Copy ${identity.hostname}` })).toBeInTheDocument();
  });
});
