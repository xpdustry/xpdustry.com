# xpdustry website

The source of [xpdustry.com](https://xpdustry.com): the home of the Xpdustry Mindustry servers and the plugins we maintain, with live server status, the team and a blog. It is built with React and [TanStack Start](https://tanstack.com/start), and reads in English, French and Russian.

## Build and test

You need Node 26 or newer and pnpm.

```bash
npm install --global pnpm
pnpm install
pnpm dev        # the site at http://localhost:3000
pnpm build      # the production build, in dist/
pnpm check      # format, lint, types, unit tests and tests of the built site
pnpm test:e2e   # the browser tests; first run `pnpm exec playwright install chromium firefox`
```

CI runs `pnpm check` and `pnpm test:e2e` on every push.

## Deploy

Build the `Dockerfile` and run the image; the server listens on port 3000.

```bash
docker build -t xpdustry-website .
docker run -p 3000:3000 --env-file .env xpdustry-website
```

Without Docker, `pnpm build` then `pnpm start` does the same and reads `.env`.

Everything works with no configuration. These environment variables change it:

| Variable                                                                                           | What it does                                                                                 |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `PORT`                                                                                             | The port to listen on, `3000` by default                                                     |
| `XPD_DISABLE_STATUS=1`                                                                             | Stops polling the Mindustry servers, Discord and GitHub                                      |
| `XPD_DISCORD_TOKEN`, `XPD_DISCORD_GUILD`                                                           | The bot that lists the team, and its server. Without them the team is `src/brand/team.json`  |
| `XPD_TEAM_ROLE_OWNER`, `XPD_TEAM_ROLE_DEVELOPER`, `XPD_TEAM_ROLE_ADMIN`, `XPD_TEAM_ROLE_MODERATOR` | The role IDs that put someone on the team with that tag, comma separated                     |
| `XPD_TEAM_ACTIVE_DAYS`                                                                             | Days since their last message someone stays on the team: `90` by default, `0` keeps everyone |

The bot needs the Server Members and Message Content intents, and Read Message History.

## Attributions

- [Lucky Fireant](https://uiverse.io/ui-kits/lucky-fireant-71-b2686726) (Great UI kit, makes the buttons fun to press).
- [Fancy leopard pattern generator](https://github.com/mgmalheiros/reaction-diffusion)
  All I could find were goofy aah AI generators for this,
  until I found this absolute GEM from a Brazilian researcher. Say thank you to claude for porting it to js.
- [Phosphor](https://phosphoricons.com) for the icons, in their bold weight (see `THIRD_PARTY_NOTICES.md`).
