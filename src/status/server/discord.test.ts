import { expect, test, vi } from "vitest";
import { fetchDiscordCounts } from "./discord";

const signal = new AbortController().signal;

test("reads the approximate counts of an invite", async () => {
  const fetchImpl = vi.fn(async () =>
    Response.json({ code: "abc", approximate_member_count: 2762, approximate_presence_count: 307 })
  );

  await expect(fetchDiscordCounts("abc", signal, fetchImpl)).resolves.toEqual({
    members: 2762,
    online: 307
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    "https://discord.com/api/v10/invites/abc?with_counts=true",
    expect.anything()
  );
});

test("rejects answers without counts", async () => {
  const fetchImpl = vi.fn(async () => Response.json({ code: "abc" }));
  await expect(fetchDiscordCounts("abc", signal, fetchImpl)).rejects.toThrow();
});
