# Xpdustry verification map

The maintained list of what a visitor can do on the site and how to prove each part works. Read this, then the file for the feature you touched. When a change adds, removes or reshapes something a visitor can do, update the matching file in the same change.

## Baseline preconditions

- `$V launch` printed `ready:` and `$V doctor` exits 0.
- [Live status](live-status.md) needs `$V launch --live`; every other feature uses the default launch.
- Each script starts from `newPage()`: a visitor with no cookies, with reduced motion, whose browser language is English unless the script says otherwise.

## Driving conventions

- Run each script with `$V run <label>` exactly as written; the label names the evidence folder.
- Each file has one main script that covers its sub-features. Bullets under `Variants` are further runs worth doing when you touched that area; adapt the main script for them and say which you ran.
- English pages have no prefix; French and Russian live under `/fr` and `/ru`. A recipe that names `/blog` means `/fr/blog` when you verify French.
- Accessible names are translated. The English names in these files become the strings in `src/_gt/fr.json` and `src/_gt/ru.json` for the other languages.
- Nothing here writes data: there is nothing to restore between journeys.

## Proof and skip reporting

- Every journey prints the observed values and snaps the state after the action.
- State the launch mode and the languages and widths you covered.
- A journey that cannot run is reported with its command and the unmet precondition, never as passed.

## Feature entry contract

Each file has an H1, one paragraph on what the visitor gets, then `Sub-features`, `How to get to it (user POV)`, `Driving it with verify.ts` and `Gotchas`, in that order.

## Features

- [Languages](languages.md): first-visit language, the switcher, prefixed URLs, the remembered choice.
- [Copy a server address](copy-server-address.md): the gamemode cards, the play card and the spread a press starts on them, and the header pill on other pages.
- [Texture entrance](texture-entrance.md): how the first screen's crown, backdrop and card blobs come in, and what a visitor without the entrance gets.
- [Blog](blog.md): the index, a post with its media and callouts, translated posts, missing posts.
- [Search and social metadata](search-metadata.md): titles, canonical and alternate links, structured data, sitemap, social cards.
- [Live status](live-status.md): player counts, Discord and GitHub figures, the health endpoint.
