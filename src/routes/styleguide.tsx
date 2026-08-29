import { For, Show, createSignal, type ParentProps } from "solid-js";
import { Callout } from "#app/components/content/Callout";
import { Pager } from "#app/components/content/Pager";
import { ProjectCard } from "#app/components/content/ProjectCard";
import { ServerCard } from "#app/components/content/ServerCard";
import { PageMeta } from "#app/components/layout/PageMeta";
import { CopyButton } from "#app/components/system/CopyButton";
import { ChevronDownIcon, DiscordIcon, GitHubIcon } from "#app/components/system/Icons";
import { Button, ButtonLink, CardLink } from "#app/components/system/Pressable";
import { projects } from "#app/data/projects";
import type { ServerSnapshotItem } from "#app/data/snapshots";
import { badge, type BadgeTone } from "#app/components/system/Badge.css";
import { document } from "#app/styles/markdown.css";
import * as styles from "./styleguide.css";

const VARIANTS = ["accent", "plain", "outline", "ghost", "signal", "danger"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const FORCED = ["rest", "hover", "press", "disabled"] as const;
const THEMES = ["light", "dark"] as const;

export default function Styleguide() {
  return (
    <>
      <PageMeta title="Style guide" description="Development fixture." path="/styleguide" />
      <div class={styles.page}>
        <header class={styles.header}>
          <h1 class={styles.pageTitle}>Style guide</h1>
          <p class={styles.lede}>
            Every component and every meaningful state in both themes. This development route is
            dropped from production, so a 404 there means the exclusion works.
          </p>
        </header>

        <For each={THEMES}>
          {(theme) => (
            <section class={styles.themePanels[theme]} data-theme={theme}>
              <h2 class={styles.themeLabel}>{theme}</h2>
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
    <div class={styles.fixtures}>
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
        <Badge variant="accent">Accent</Badge>
        <Badge variant="signal">Prerelease</Badge>
        <Badge variant="danger">Offline</Badge>
        <Badge variant="quiet">WIP</Badge>
        <Badge variant="default">Default</Badge>
      </Group>

      <Group title="Status dots">
        <span class={styles.statusDots.live} />
        <span class={styles.statusDots.signal} />
        <span class={styles.statusDots.danger} />
      </Group>

      <Group title="Loader">
        <span class={styles.loader} aria-label="Loading">
          <For each={styles.loaderDots}>{(className) => <span class={className} />}</For>
        </span>
      </Group>

      <Group title="Copy control" stack>
        <CopyButton value="survival.md.xpdustry.com" label="Copy address" />
        <CopyButton value="" label="Copy (always fails)" />
      </Group>

      <Group title="States" stack>
        <State title="Checking servers…">The first status poll is still running.</State>
        <State title="Servers unavailable">
          No server answered the last poll. The addresses stay correct either way.
        </State>
        <State title="Nothing published yet" centered>
          Posts will show up here as they are written.
        </State>
      </Group>

      <Group title="Project cards, documented and flat" stack>
        <div class={styles.projectGrid}>
          <For each={projects}>{(project) => <ProjectCard project={project} />}</For>
        </div>
      </Group>

      <Group title="Server cards, every status" stack>
        <ul class={styles.serverGrid}>
          <ServerCard server={serverFixture({ status: "online" })} />
          <ServerCard server={serverFixture({ status: "online", playerLimit: 0 })} />
          <ServerCard server={serverFixture({ status: "online", long: true })} />
          <ServerCard server={serverFixture({ status: "offline" })} />
          <ServerCard server={serverFixture({ status: "polling" })} />
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
        <div class={`${styles.proseFrame} ${document}`}>
          <h2>A heading with an anchor</h2>
          <p>
            Body copy with <a href="#">a link</a>, <strong>bold</strong>, <em>italic</em> and{" "}
            <code>inline code</code> in it.
          </p>
          <ul>
            <li>An unordered item</li>
            <li>Another one</li>
          </ul>
          <div class={styles.tableFrame}>
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
          <figure class={styles.codeFigure}>
            <figcaption class={styles.codeCaption}>
              <span class={styles.codeLabel}>bash</span>
              <CopyButton value="echo hello" variant="plain" size="sm" />
            </figcaption>
            <pre class={styles.codeBlock}>
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
        <CardLink faceClass={styles.cardLink} href="#">
          <span class={`${badge.quiet} ${styles.cardBadge}`}>NoHorny</span>
          <span class={styles.cardTitle}>Beta 8 blurs your alerts, and breaks older clients</span>
          <span class={styles.cardMeta}>
            <span class={styles.cardAuthor}>
              a deliberately long free-text author name that has to wrap
            </span>
            <span class={styles.mono}>20 Jul 2026</span>
          </span>
        </CardLink>
      </Group>

      <Group title="Typography" stack>
        <p class={styles.display}>Display</p>
        <p class={styles.pageTitle}>Heading 1</p>
        <p class={styles.headingTwo}>Heading 2</p>
        <p class={styles.headingThree}>Heading 3</p>
        <p class={styles.lede}>Lead paragraph, used under a section heading.</p>
        <p>Body copy at the default size.</p>
        <p class={styles.note}>A note, one step down from body.</p>
        <p class={styles.mono}>MONO 1234567890</p>
      </Group>

      <Group title="Focus rings">
        <FocusDemo />
      </Group>
    </div>
  );
}

function Badge(props: ParentProps<{ variant: BadgeTone }>) {
  return <span class={badge[props.variant]}>{props.children}</span>;
}

function State(props: ParentProps<{ title: string; centered?: boolean }>) {
  return (
    <div class={props.centered ? styles.states.centered : styles.states.default}>
      <span class={styles.stateTitle}>{props.title}</span>
      <p>{props.children}</p>
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
        <span class={styles.mono}>focused</span>
      </Show>
      <a class={styles.navLink} href="#">
        A nav link
      </a>
      <a class={styles.skipLink} href="#main">
        Skip to content
      </a>
    </>
  );
}

function Group(props: ParentProps<{ title: string; stack?: boolean }>) {
  return (
    <section class={styles.group}>
      <h3 class={styles.groupTitle}>{props.title}</h3>
      <div class={props.stack ? styles.groupLayouts.stack : styles.groupLayouts.row}>
        {props.children}
      </div>
    </section>
  );
}

type ServerFixtureOptions =
  | { status: "online"; playerLimit?: number; long?: boolean }
  | { status: "polling"; long?: boolean }
  | { status: "offline"; long?: boolean };

function serverFixture(options: ServerFixtureOptions): ServerSnapshotItem {
  const identity = {
    slug: "survival",
    label: options.long ? "A server whose label is far longer than it should be" : "Survival",
    hostname: "survival.md.xpdustry.com",
  };

  if (options.status === "polling" || options.status === "offline") {
    return { ...identity, status: options.status };
  }

  return {
    ...identity,
    status: "online",
    info: {
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
    },
  };
}
