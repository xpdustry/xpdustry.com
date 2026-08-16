/**
 * The development style guide.
 *
 * A visual regression fixture, not a marketing page: it renders every
 * meaningful variant of every component, in both accents, including the
 * states that are hard to reach by hand (a failed clipboard, an offline
 * server, a release feed that never loaded). The route file is excluded from
 * the production route scan, so this page does not exist in a built site.
 */

import { For, Show, createSignal } from "solid-js";
import type { ParentProps } from "solid-js";
import { Callout } from "#app/components/content/Callout";
import { Pager } from "#app/components/content/Pager";
import { ProjectCard } from "#app/components/content/ProjectCard";
import { ServerCard } from "#app/components/content/ServerCard";
import { BlobField, PAGE_HEAD_BLOBS } from "#app/components/layout/BlobField";
import { PageMeta } from "#app/components/layout/PageMeta";
import { CopyButton } from "#app/components/system/CopyButton";
import { ChevronDownIcon, DiscordIcon, GitHubIcon } from "#app/components/system/Icons";
import { Button, ButtonLink, CardLink } from "#app/components/system/Pressable";
import { projects } from "#app/data/projects";
import type { ServerSnapshotItem } from "#app/data/snapshots";

const VARIANTS = ["accent", "plain", "outline", "ghost", "signal", "danger"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const FORCED = ["rest", "hover", "press", "disabled"] as const;

export default function Styleguide() {
  return (
    <>
      <PageMeta title="Style guide" description="Development fixture." path="/styleguide" />
      <BlobField artwork={PAGE_HEAD_BLOBS} />

      <div class="wrap py-12 pb-24">
        <header class="mb-12 max-w-prose">
          <h1 class="text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl">
            Style guide
          </h1>
          <p class="max-w-prose text-base text-ink-muted sm:text-lg">
            Every component and every meaningful state in both themes. This development route is
            dropped from production, so a 404 there means the exclusion works.
          </p>
        </header>

        {/* Each panel renders twice, once per theme, by scoping data-theme to
            the panel rather than the document. That is the only way to see
            both themes in one screenshot. */}
        <For each={["light", "dark"] as const}>
          {(theme) => (
            <section
              class="mt-12 min-w-0 rounded-2xl border-2 border-line bg-page p-8 text-ink"
              data-theme={theme}
            >
              <h2 class="mb-8 font-mono text-data tracking-wider text-ink-faint uppercase tabular-nums">
                {theme}
              </h2>
              <Fixtures />
            </section>
          )}
        </For>
      </div>
    </>
  );
}

function Fixtures() {
  return (
    <div class="grid min-w-0 gap-12">
      <Group title="Buttons: variants">
        <For each={VARIANTS}>
          {(variant) => (
            <Button variant={variant}>{variant[0].toUpperCase() + variant.slice(1)}</Button>
          )}
        </For>
      </Group>

      <Group title="Buttons: sizes">
        <For each={SIZES}>
          {(size) => (
            <Button variant="accent" size={size}>
              Size {size}
            </Button>
          )}
        </For>
      </Group>

      <Group title="Buttons: forced states">
        <For each={FORCED}>
          {(state) => (
            <Button
              variant="accent"
              data-force={state === "rest" ? undefined : state}
              disabled={state === "disabled"}
            >
              {state}
            </Button>
          )}
        </For>
      </Group>

      <Group title="Buttons: with icons">
        <ButtonLink variant="accent" href="#">
          <DiscordIcon />
          Discord
        </ButtonLink>
        <ButtonLink variant="outline" href="#">
          <GitHubIcon />
          GitHub
        </ButtonLink>
        <Button variant="plain" icon aria-label="Open menu">
          <ChevronDownIcon />
        </Button>
        <Button variant="plain" size="sm" icon aria-label="Open menu">
          <ChevronDownIcon />
        </Button>
      </Group>

      <Group title="Badges">
        <span class={`${badge} border-accent-wall bg-accent text-on-accent`}>Accent</span>
        <span class={`${badge} border-signal-wall bg-signal text-on-signal`}>Prerelease</span>
        <span class={`${badge} border-danger-wall bg-danger text-white`}>Offline</span>
        <span class={`${badge} border-line-soft bg-page-sunk text-ink-muted`}>WIP</span>
        <span class={`${badge} border-line bg-panel`}>Default</span>
      </Group>

      <Group title="Status dots">
        <span class="dot--live size-2.5 shrink-0 rounded-full border-2 border-line bg-accent" />
        <span class="size-2.5 shrink-0 rounded-full border-2 border-line bg-signal" />
        <span class="size-2.5 shrink-0 rounded-full border-2 border-line bg-danger" />
      </Group>

      <Group title="Loader">
        <span class="loader inline-flex gap-3">
          <span />
          <span />
          <span />
        </span>
      </Group>

      <Group title="Copy control" stack>
        <CopyButton value="survival.md.xpdustry.com" label="Copy address" />
        {/* Forcing the failure path: no clipboard, no fallback target. */}
        <CopyButton value="" label="Copy (always fails)" />
      </Group>

      <Group title="States" stack>
        <div class={stateBox}>
          <span class="font-bold text-ink">Checking servers…</span>
          <p>The first status poll is still running.</p>
        </div>
        <div class={stateBox}>
          <span class="font-bold text-ink">Servers unavailable</span>
          <p>No server answered the last poll. The addresses stay correct either way.</p>
        </div>
        <div class={`${stateBox} justify-items-center text-center`}>
          <span class="font-bold text-ink">Nothing published yet</span>
          <p>Posts will show up here as they are written.</p>
        </div>
      </Group>

      <Group title="Project cards, documented and flat" stack>
        <div class="project-grid grid auto-rows-fr gap-6">
          <For each={projects}>{(project) => <ProjectCard project={project} />}</For>
        </div>
      </Group>

      <Group title="Server cards, every status" stack>
        <ul class="server-grid m-0 grid list-none gap-4 p-0">
          <ServerCard server={serverFixture({})} state="ready" />
          <ServerCard server={serverFixture({ playerLimit: 0 })} state="ready" />
          <ServerCard server={serverFixture({ long: true })} state="ready" />
          <ServerCard server={serverFixture({ online: false })} state="ready" />
          <ServerCard server={serverFixture({ online: false })} state="loading" />
        </ul>
      </Group>

      <Group title="Callouts" stack>
        <Callout>
          <p>The client classifies one group at a time.</p>
        </Callout>
        <Callout variant="warn" label="Upgrade first">
          <p>Releases older than beta 8 no longer work against the public instance.</p>
        </Callout>
        <Callout variant="danger" label="Breaking">
          <p>This one removes a setting rather than deprecating it.</p>
        </Callout>
      </Group>

      <Group title="Prose" stack>
        <div class="doc max-w-full min-w-0 overflow-hidden leading-relaxed text-ink-muted">
          <h2>A heading with an anchor</h2>
          <p>
            Body copy with <a href="#">a link</a>, <strong>bold</strong>, <em>italic</em> and{" "}
            <code>inline code</code> in it.
          </p>
          <ul>
            <li>An unordered item</li>
            <li>Another one</li>
          </ul>
          <div class="max-w-full min-w-0 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
            <table>
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>nohorny-auto-mod-policy</code>
                  </td>
                  <td>
                    A description long enough to make the second column wrap while the first stays
                    on one line, which is the behaviour worth checking here.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <figure class="max-w-full min-w-0 overflow-hidden rounded-2xl border-2 border-line bg-panel-sunk">
            <figcaption class="flex items-center justify-between gap-4 border-b border-line-soft bg-page-sunk py-2 pr-2 pl-4">
              <span class="font-mono text-data tracking-tight text-ink-faint">bash</span>
              <CopyButton value="echo hello" variant="plain" size="sm" />
            </figcaption>
            <pre class="m-0 overflow-x-auto px-6 py-4 font-mono text-data leading-relaxed tracking-tight tab-2 text-ink">
              <code>
                <span class="t-c"># a comment</span>
                {"\n"}
                <span class="t-k">wget</span> -O config/mods/nohorny-client.jar{" "}
                <span class="t-s">
                  https://example.invalid/a/very/long/url/that/overflows/the/block/width
                </span>
                {"\n"}
                <span class="t-n">42</span>
              </code>
            </pre>
          </figure>
        </div>
      </Group>

      <Group title="Pager" stack>
        <Pager
          label="Style guide pager"
          previous={{ href: "#", title: "Overview" }}
          next={{ href: "#", title: "Install the plugin" }}
        />
        <Pager label="Style guide pager, end" next={{ href: "#", title: "Only a next link" }} />
      </Group>

      <Group title="Card link" stack>
        <CardLink
          faceClass="flex flex-col items-stretch justify-start gap-3 p-6 text-left"
          href="#"
        >
          <span class={`${badge} self-start border-line-soft bg-page-sunk text-ink-muted`}>
            NoHorny
          </span>
          <span class="text-xl leading-tight font-bold text-ink sm:text-2xl">
            Beta 8 blurs your alerts, and breaks older clients
          </span>
          <span class="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm text-ink-muted">
            <span class="inline-flex min-w-0 items-center gap-2 wrap-anywhere">
              a deliberately long free-text author name that has to wrap
            </span>
            <span class="font-mono text-data tracking-tight text-ink-faint">20 Jul 2026</span>
          </span>
        </CardLink>
      </Group>

      <Group title="Typography" stack>
        <p class="text-5xl font-extrabold tracking-tight stretch-110 sm:text-7xl">Display</p>
        <p class="text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl">Heading 1</p>
        <p class="text-3xl font-bold tracking-tight stretch-110 sm:text-4xl">Heading 2</p>
        <p class="text-xl font-bold sm:text-2xl">Heading 3</p>
        <p class="max-w-prose text-base text-ink-muted sm:text-lg">
          Lead paragraph, used under a section heading.
        </p>
        <p>Body copy at the default size.</p>
        <p class="max-w-prose text-sm text-ink-muted">A note, one step down from body.</p>
        <p class="font-mono text-data tracking-tight text-ink-faint tabular-nums">
          MONO 1234567890
        </p>
      </Group>

      <Group title="Focus rings">
        <FocusDemo />
      </Group>
    </div>
  );
}

function FocusDemo() {
  const [focused, setFocused] = createSignal(false);
  return (
    <>
      <Button variant="plain" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
        Tab to me
      </Button>
      <Show when={focused()}>
        <span class="font-mono text-data tracking-tight text-ink-faint tabular-nums">focused</span>
      </Show>
      <a
        class="inline-flex h-8.5 items-center rounded-md px-3 text-sm font-semibold text-ink-muted no-underline hover:bg-panel hover:text-ink"
        href="#"
      >
        A nav link
      </a>
      <a
        class="rounded-lg border-2 border-line bg-panel px-4 py-3 font-bold no-underline"
        href="#main"
      >
        Skip to content
      </a>
    </>
  );
}

function Group(props: ParentProps<{ title: string; stack?: boolean }>) {
  return (
    <section class="grid min-w-0 gap-3">
      <h3 class="border-b border-line-soft pb-2 font-mono text-data tracking-wider text-ink-faint uppercase tabular-nums">
        {props.title}
      </h3>
      <div class={props.stack ? "grid min-w-0 gap-6" : "flex min-w-0 flex-wrap items-center gap-4"}>
        {props.children}
      </div>
    </section>
  );
}

const badge =
  "inline-flex items-center gap-2 rounded-sm border px-3 py-0.75 font-mono text-xs leading-normal font-semibold tracking-tight whitespace-nowrap";
const stateBox =
  "grid justify-items-start gap-3 rounded-2xl border border-dashed border-line-soft bg-panel-sunk px-6 py-8 text-ink-muted";

function serverFixture(options: {
  online?: boolean;
  playerLimit?: number;
  long?: boolean;
}): ServerSnapshotItem {
  const online = options.online ?? true;
  return {
    slug: "survival",
    label: options.long ? "A server whose label is far longer than it should be" : "Survival",
    hostname: "survival.md.xpdustry.com",
    online,
    polledAt: "2026-08-15T00:00:00.000Z",
    pingMs: 41,
    info: online
      ? {
          name: "Survival",
          description: options.long
            ? "A description long enough to need clamping, because a server operator can write whatever they want in there and the card still has to hold its shape next to the others in the grid."
            : "The best mindustry server of all time",
          map: options.long ? "A map name that will not fit on one line either" : "Fungal Pass",
          mode: "survival",
          players: 27,
          playerLimit: options.playerLimit ?? 50,
          wave: 142,
          version: 159,
          versionType: "official",
        }
      : undefined,
  };
}
