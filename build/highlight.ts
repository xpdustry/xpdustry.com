/**
 * A four-token highlighter: comments, strings, numbers, keywords.
 *
 * Three colours plus ink is the whole palette `prose.css` defines, so a full
 * grammar would have nowhere to put its extra classes. Each language is one
 * ordered list of patterns; the first that matches at a position wins, and
 * everything else is plain text.
 */

export type TokenKind = "comment" | "string" | "number" | "keyword";

export interface Token {
  kind: TokenKind | null;
  value: string;
}

interface Rule {
  kind: TokenKind;
  pattern: RegExp;
}

const NUMBER = /\d+(?:\.\d+)*/y;

function words(kind: TokenKind, list: readonly string[]): Rule {
  return { kind, pattern: new RegExp(`(?:${list.join("|")})\\b`, "y") };
}

const JVM_KEYWORDS = [
  "abstract",
  "boolean",
  "byte",
  "catch",
  "char",
  "class",
  "const",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "if",
  "implements",
  "import",
  "int",
  "interface",
  "long",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "throws",
  "try",
  "val",
  "var",
  "void",
  "while",
  "fun",
  "object",
  "override",
  "true",
  "false",
  "null",
];

const GRADLE_KEYWORDS = [
  "dependencies",
  "repositories",
  "plugins",
  "maven",
  "implementation",
  "compileOnly",
  "testImplementation",
  "url",
  "uri",
  "id",
  "version",
];

const SHELL_KEYWORDS = [
  "cd",
  "cp",
  "curl",
  "docker",
  "echo",
  "export",
  "gradlew",
  "java",
  "mkdir",
  "mv",
  "podman",
  "pnpm",
  "rm",
  "sudo",
  "wget",
];

const LOG_KEYWORDS = ["DEBUG", "ERROR", "INFO", "TRACE", "WARN"];

const RULES: Record<string, readonly Rule[]> = {
  bash: [
    { kind: "comment", pattern: /#[^\n]*/y },
    { kind: "string", pattern: /'[^'\n]*'|"[^"\n]*"|https?:\/\/\S+/y },
    words("keyword", SHELL_KEYWORDS),
    { kind: "number", pattern: NUMBER },
  ],
  log: [
    words("keyword", LOG_KEYWORDS),
    { kind: "string", pattern: /https?:\/\/\S+/y },
    { kind: "number", pattern: NUMBER },
  ],
  java: [
    { kind: "comment", pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y },
    { kind: "string", pattern: /"(?:[^"\\\n]|\\.)*"/y },
    words("keyword", JVM_KEYWORDS),
    { kind: "number", pattern: NUMBER },
  ],
  gradle: [
    { kind: "comment", pattern: /\/\/[^\n]*/y },
    { kind: "string", pattern: /"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/y },
    words("keyword", [...GRADLE_KEYWORDS, ...JVM_KEYWORDS]),
    { kind: "number", pattern: NUMBER },
  ],
  yaml: [
    { kind: "comment", pattern: /#[^\n]*/y },
    { kind: "string", pattern: /'[^'\n]*'|"[^"\n]*"/y },
    { kind: "keyword", pattern: /^[ \t]*[\w.-]+(?=:)/my },
    { kind: "number", pattern: NUMBER },
  ],
  properties: [
    { kind: "comment", pattern: /#[^\n]*/y },
    { kind: "keyword", pattern: /^[ \t]*[\w.-]+(?==)/my },
    { kind: "number", pattern: NUMBER },
  ],
};

/** Languages the four-token scheme covers; anything else renders as plain ink. */
export const HIGHLIGHTED_LANGUAGES = Object.keys(RULES);

const ALIASES: Record<string, string> = {
  sh: "bash",
  shell: "bash",
  console: "bash",
  kotlin: "gradle",
  kts: "gradle",
  groovy: "gradle",
  yml: "yaml",
  env: "properties",
  conf: "properties",
};

export function highlight(source: string, language: string | undefined): Token[] {
  const rules = language ? RULES[ALIASES[language] ?? language] : undefined;
  if (!rules) return [{ kind: null, value: source }];

  const tokens: Token[] = [];
  let plain = "";
  let index = 0;

  const flush = () => {
    if (plain !== "") {
      tokens.push({ kind: null, value: plain });
      plain = "";
    }
  };

  outer: while (index < source.length) {
    for (const rule of rules) {
      rule.pattern.lastIndex = index;
      const match = rule.pattern.exec(source);
      // A sticky pattern can only match at lastIndex, but `^` with `m` still
      // reports a zero-length match on an empty line; guard against the
      // infinite loop that would cause.
      if (match && match[0].length > 0) {
        flush();
        tokens.push({ kind: rule.kind, value: match[0] });
        index += match[0].length;
        continue outer;
      }
    }
    plain += source[index];
    index += 1;
  }

  flush();
  return tokens;
}

export const TOKEN_CLASS: Record<TokenKind, string> = {
  comment: "t-c",
  string: "t-s",
  number: "t-n",
  keyword: "t-k",
};
