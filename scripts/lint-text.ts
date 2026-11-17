import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const EN_DASH = String.fromCodePoint(0x2013);
const EM_DASH = String.fromCodePoint(0x2014);
const HORIZONTAL_BAR = String.fromCodePoint(0x2015);
const FORBIDDEN = new RegExp(`[${EN_DASH}${EM_DASH}${HORIZONTAL_BAR}]`);
const TEXT = /\.(?:[cm]?[jt]sx?|json|md|ya?ml|css|html|txt|xml|svg|webmanifest)$/;

const filesGitKeeps = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" }
)
  .split("\0")
  .filter((file) => TEXT.test(file) && existsSync(file));

const dashes = filesGitKeeps.flatMap((file) =>
  readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, index) =>
      FORBIDDEN.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : []
    )
);

for (const dash of dashes) console.error(dash);
if (dashes.length > 0) {
  console.error(
    `\n${dashes.length} line(s) with an en dash, an em dash or a horizontal bar: write a hyphen, a colon or a comma.`
  );
  process.exitCode = 1;
}
