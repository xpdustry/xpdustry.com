interface AstNode {
  type: string;
  parent?: AstNode;
  [field: string]: unknown;
}

interface Property extends AstNode {
  computed: boolean;
  key: AstNode;
  value: AstNode;
}

interface Variable {
  defs: { type: string; node: AstNode; parent: AstNode | null }[];
}

interface Scope {
  set: Map<string, Variable>;
  upper: Scope | null;
}

interface RuleContext {
  report: (problem: { node: AstNode; messageId: string; data?: Record<string, string> }) => void;
  sourceCode: { getScope: (node: AstNode) => Scope };
}

/** What an expression this file does not declare reads as. */
const UNKNOWN = "\u0000";
/** How many `const` hops to follow from a transition to its value. */
const MOST_HOPS = 4;

function keyName(key: AstNode): string {
  if (key.type === "Identifier") return key.name as string;
  if (key.type === "Literal") return String(key.value);
  return "";
}

/** The `const` a name is declared by in this file, if any: a name imported or computed is not followed. */
function declaredValue(context: RuleContext, at: AstNode, name: string): AstNode | undefined {
  for (let scope: Scope | null = context.sourceCode.getScope(at); scope; scope = scope.upper) {
    const variable = scope.set.get(name);
    if (!variable) continue;
    const [definition] = variable.defs;
    const declaration = definition?.parent;
    if (definition?.type !== "Variable" || declaration?.kind !== "const") return undefined;
    return (definition.node.init as AstNode | null) ?? undefined;
  }
  return undefined;
}

/**
 * The CSS text a value writes. A template's expressions read as their `const` string when they
 * have one in this file, and as `UNKNOWN` otherwise.
 */
function cssText(context: RuleContext, value: AstNode, hops = 0): string | number | undefined {
  if (value.type === "Literal") return value.value as string | number;
  if (value.type === "TemplateLiteral") {
    const expressions = value.expressions as AstNode[];
    return (value.quasis as { value: { cooked: string } }[])
      .map(({ value: { cooked } }, index) => {
        const expression = expressions[index];
        if (!expression) return cooked;
        const known = cssText(context, expression, hops + 1);
        return cooked + (typeof known === "string" ? known : UNKNOWN);
      })
      .join("");
  }
  if (value.type === "Identifier" && hops < MOST_HOPS) {
    const declared = declaredValue(context, value, value.name as string);
    return declared && cssText(context, declared, hops + 1);
  }
  return undefined;
}

const textOf = (node: AstNode): string =>
  node.type === "Literal"
    ? String(node.value)
    : node.type === "TemplateLiteral"
      ? (node.quasis as { value: { cooked: string } }[]).map(({ value }) => value.cooked).join("")
      : "";

const isMediaHover = (node: AstNode) =>
  node.type === "MemberExpression" &&
  (node.object as AstNode).type === "Identifier" &&
  (node.object as AstNode).name === "media" &&
  (node.property as AstNode).name === "hover";

/** `media.hover`, a query that adds to it, or one that spells out `(hover: hover)`. */
const isHoverMedia = (key: AstNode) =>
  isMediaHover(key) ||
  (key.type === "TemplateLiteral" && (key.expressions as AstNode[]).some(isMediaHover)) ||
  textOf(key).includes("(hover: hover)");

/** Inside `"@media": { [media.hover]: … }`, the one place a hover style may go. */
function underHoverMedia(node: AstNode): boolean {
  for (let at = node.parent; at; at = at.parent) {
    if (at.type === "Property" && isHoverMedia(at.key as AstNode)) return true;
  }
  return false;
}

/** A style object that is nothing but hover media: what a `globalStyle` on a hover selector takes. */
function onlyHoverMedia(style: AstNode | undefined): boolean {
  if (style?.type !== "ObjectExpression") return false;
  return (style.properties as Property[]).every(
    (property) =>
      keyName(property.key) === "@media" &&
      property.value.type === "ObjectExpression" &&
      (property.value.properties as Property[]).every((query) => isHoverMedia(query.key))
  );
}

const hoverNeedsHoverMedia = {
  meta: {
    type: "problem",
    messages: {
      hover:
        "Put this hover style under `media.hover` from src/ui/styles/media.ts: a touch screen keeps :hover after a tap. Focus and open states go outside it."
    }
  },
  create: (context: RuleContext) => ({
    Property(property: Property) {
      if (!textOf(property.key).includes(":hover")) return;
      if (!underHoverMedia(property)) context.report({ node: property, messageId: "hover" });
    },
    CallExpression(call: AstNode) {
      const callee = call.callee as AstNode;
      const [selector, style] = call.arguments as AstNode[];
      if (callee.type !== "Identifier" || callee.name !== "globalStyle" || !selector) return;
      if (!textOf(selector).includes(":hover")) return;
      if (!onlyHoverMedia(style) && !underHoverMedia(call)) {
        context.report({ node: call, messageId: "hover" });
      }
    }
  })
};

/** Properties that move the layout, so every frame of their transition lays the page out again. */
const LAYOUT =
  /^(?:width|height|(?:min|max)-(?:width|height)|top|right|bottom|left|inset(?:-.+)?|margin(?:-.+)?|padding(?:-.+)?|border(?:-[a-z]+)?-width|font-size|line-height|letter-spacing|flex(?:-basis)?|grid-template-(?:columns|rows)|gap|row-gap|column-gap)$/;

/** A transition's comma-separated entries, ignoring the commas inside `cubic-bezier(…)`. */
function entries(transition: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < transition.length; index++) {
    const character = transition[index];
    if (character === "(") depth++;
    else if (character === ")") depth--;
    else if (character === "," && depth === 0) {
      found.push(transition.slice(start, index));
      start = index + 1;
    }
  }
  return [...found, transition.slice(start)].map((entry) => entry.trim()).filter(Boolean);
}

const transitionKeys = new Set(["transition", "transitionProperty", "transition-property"]);

const noLayoutTransition = {
  meta: {
    type: "problem",
    messages: {
      all: "Name the properties this transition moves: `all` also moves whatever a later style changes.",
      layout:
        "Transition `{{property}}` lays the page out again on every frame: move it with transform, translate, scale or opacity."
    }
  },
  create: (context: RuleContext) => ({
    Property(property: Property) {
      const name = keyName(property.key);
      if (property.computed || !transitionKeys.has(name)) return;
      const text = cssText(context, property.value);
      if (typeof text !== "string") return;
      for (const word of entries(text).flatMap((entry) => entry.split(/\s+/))) {
        if (word === "all") context.report({ node: property, messageId: "all" });
        else if (LAYOUT.test(word)) {
          context.report({ node: property, messageId: "layout", data: { property: word } });
        }
      }
    }
  })
};

export default {
  meta: { name: "xpdustry" },
  rules: {
    "hover-needs-hover-media": hoverNeedsHoverMedia,
    "no-layout-transition": noLayoutTransition
  }
};
