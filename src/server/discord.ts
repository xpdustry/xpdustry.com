import * as v from "valibot";
import type { DiscordCounts } from "#app/data/live";

const InviteSchema = v.object({
  approximate_member_count: v.pipe(v.number(), v.integer(), v.minValue(0)),
  approximate_presence_count: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export async function fetchDiscordCounts(
  invite: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<DiscordCounts> {
  const response = await fetchImpl(
    `https://discord.com/api/v10/invites/${encodeURIComponent(invite)}?with_counts=true`,
    { headers: { accept: "application/json" }, signal },
  );
  if (!response.ok) throw new Error(`Discord answered ${response.status} ${response.statusText}`);

  const body = v.parse(InviteSchema, await response.json());
  return { members: body.approximate_member_count, online: body.approximate_presence_count };
}
