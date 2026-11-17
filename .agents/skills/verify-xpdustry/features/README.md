# What only a person or the real world can check

Everything a test can judge is in `tests/` and runs with `pnpm check` and `pnpm test:e2e`; [SKILL.md](../SKILL.md) says where. What is left here needs the live outside world or a person's eye. When a change adds something a visitor does, add a test for it first, and a file here only for what the test cannot judge.

Each file has an H1, a paragraph on what is judged, then `How to get to it (user POV)`, `Capturing it` and `What to judge`.

- [Live status](live-status.md): player counts, Discord and GitHub figures and the team as Discord lists it, against the real services. Needs `$V launch --live`.
- [Texture entrance](texture-entrance.md): whether the first screen's entrance and the logo's wave read as one calm motion.
- [Copy a server address](copy-server-address.md): whether a card's spread and its dissolve feel right.
- [Social cards](search-metadata.md): whether each card reads well in its language.

Report what you judged with the evidence folder, the launch mode, the browsers and the widths. A journey you could not run is reported with its command and what was missing, never as passed.
