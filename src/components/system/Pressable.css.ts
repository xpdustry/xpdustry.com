import { createVar, globalStyle, type StyleRule } from "@vanilla-extract/css";
import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import {
  colors,
  leading,
  motion,
  palette,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

const depth = createVar();
const depthRest = createVar();
const edge = createVar();
const face = createVar();
const faceGloss = createVar();
const onFace = createVar();
const transitionDuration = createVar();
const wall = createVar();

const disabledRule = {
  vars: {
    [depth]: "0px",
    [edge]: colors.lineSoft,
    [face]: colors.pageSunk,
    [faceGloss]: "transparent",
    [onFace]: colors.inkFaint,
    [wall]: colors.pageSunk,
  },
  cursor: "not-allowed",
} satisfies StyleRule;

export const pressable = recipe({
  base: {
    vars: {
      [depthRest]: space.one,
      [depth]: depthRest,
      [edge]: colors.line,
      [face]: colors.panel,
      [faceGloss]: "transparent",
      [onFace]: colors.ink,
      [transitionDuration]: motion.release,
      [wall]: colors.line,
    },
    position: "relative",
    display: "inline-block",
    isolation: "isolate",
    marginTop: depthRest,
    padding: 0,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: edge,
    borderRadius: radii.lg,
    backgroundColor: wall,
    color: "inherit",
    textDecoration: "none",
    verticalAlign: "middle",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, border-color",
    transitionDuration: motion.fast,
    transitionTimingFunction: "linear",
    ":focus-visible": {
      outline: `3px solid ${colors.focus}`,
      outlineOffset: "3px",
    },
    selectors: {
      '&:where(:hover:not(:disabled, [aria-disabled="true"])), &[data-force="hover"]': {
        vars: { [depth]: `calc(${depthRest} + ${space.half})` },
      },
      '&:where(:active:not(:disabled, [aria-disabled="true"])), &[data-force="press"]': {
        vars: { [depth]: "0px", [transitionDuration]: motion.press },
      },
      "&:disabled, &[aria-disabled='true'], &[data-force='disabled']": disabledRule,
    },
  },
  variants: {
    variant: {
      accent: {
        vars: {
          [edge]: palette.accentWall,
          [face]: palette.accent,
          [faceGloss]: palette.gloss,
          [onFace]: palette.onAccent,
          [wall]: palette.accentWall,
        },
        selectors: {
          '&:where(:hover:not(:disabled, [aria-disabled="true"])), &[data-force="hover"]': {
            vars: { [face]: palette.accentHover },
          },
          '&:where(:active:not(:disabled, [aria-disabled="true"])), &[data-force="press"]': {
            vars: { [face]: palette.accentPressed },
          },
        },
      },
      plain: {
        selectors: {
          '&:where(:hover:not(:disabled, [aria-disabled="true"])), &[data-force="hover"]': {
            vars: { [face]: colors.panelSunk },
          },
        },
      },
      outline: {
        vars: { [face]: colors.page },
        selectors: {
          '&:where(:hover:not(:disabled, [aria-disabled="true"])), &[data-force="hover"]': {
            vars: { [face]: colors.panel },
          },
        },
      },
      ghost: {
        vars: {
          [depthRest]: "0px",
          [depth]: "0px",
          [edge]: "transparent",
          [face]: "transparent",
          [onFace]: colors.inkMuted,
          [wall]: "transparent",
        },
        marginTop: 0,
        selectors: {
          '&:where(:hover:not(:disabled, [aria-disabled="true"])), &[data-force="hover"]': {
            vars: { [depth]: "0px", [face]: colors.panel, [onFace]: colors.ink },
          },
          '&:where(:active:not(:disabled, [aria-disabled="true"])), &[data-force="press"]': {
            vars: { [depth]: "0px", [face]: colors.pageSunk },
          },
        },
      },
      signal: {
        vars: {
          [edge]: palette.signalWall,
          [face]: palette.signal,
          [faceGloss]: palette.gloss,
          [onFace]: palette.onSignal,
          [wall]: palette.signalWall,
        },
      },
      danger: {
        vars: {
          [edge]: palette.dangerWall,
          [face]: palette.danger,
          [faceGloss]: palette.gloss,
          [onFace]: palette.onDanger,
          [wall]: palette.dangerWall,
        },
      },
    },
    size: {
      sm: {
        vars: { [depthRest]: "3px" },
        borderRadius: radii.md,
      },
      md: {},
      lg: {
        vars: { [depthRest]: `calc(${space.one} + ${space.half})` },
        borderRadius: radii.xl,
      },
    },
    card: {
      true: {
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: radii.twoXl,
      },
      false: {},
    },
    block: {
      true: { display: "block", width: "100%" },
      false: {},
    },
    disabled: {
      true: {
        ...disabledRule,
        ":hover": disabledRule,
        ":active": {
          ...disabledRule,
          vars: { ...disabledRule.vars, [transitionDuration]: motion.release },
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    variant: "plain",
    size: "md",
    card: false,
    block: false,
    disabled: false,
  },
});

export const pressableFace = recipe({
  base: {
    display: "flex",
    minHeight: "2.75rem",
    alignItems: "center",
    justifyContent: "center",
    gap: space.two,
    margin: "-2px",
    padding: `0 ${space.six}`,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: edge,
    borderRadius: "inherit",
    backgroundColor: face,
    backgroundImage: `linear-gradient(${faceGloss} 0 42%, transparent 42%)`,
    color: onFace,
    fontSize: type.sm,
    fontWeight: weight.bold,
    fontStretch: "105%",
    letterSpacing: "0.005em",
    lineHeight: leading.sm,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transform: `translateY(calc(${depth} * -1))`,
    transitionProperty: "transform, background-color, border-color, color",
    transitionDuration,
    transitionTimingFunction: motion.ease,
  },
  variants: {
    size: {
      sm: {
        minHeight: "2.125rem",
        paddingInline: space.four,
        fontSize: type.xs,
      },
      md: {},
      lg: {
        minHeight: "3.5rem",
        paddingInline: space.eight,
        fontSize: type.base,
      },
    },
    icon: {
      true: { width: "2.75rem", paddingInline: 0 },
      false: {},
    },
    format: {
      label: {},
      code: {
        overflow: "hidden",
        paddingInline: space.three,
        fontFamily: type.mono,
        fontWeight: weight.medium,
        letterSpacing: tracking.tight,
      },
    },
    card: {
      true: {
        width: "auto",
        height: "calc(100% + 4px)",
        minHeight: 0,
        padding: 0,
        whiteSpace: "normal",
      },
      false: {},
    },
  },
  compoundVariants: [
    { variants: { icon: true, size: "sm" }, style: { width: "2.125rem" } },
    { variants: { icon: true, size: "lg" }, style: { width: "3.5rem" } },
  ],
  defaultVariants: {
    size: "md",
    icon: false,
    format: "label",
    card: false,
  },
});

globalStyle(`${pressableFace.classNames.base} svg`, {
  flex: "none",
  inlineSize: "1.05em",
  blockSize: "1.05em",
});

globalStyle(`${pressableFace.classNames.base}${pressableFace.classNames.variants.icon.true} svg`, {
  inlineSize: "1.5em",
  blockSize: "1.5em",
});

type PressableVariants = NonNullable<RecipeVariants<typeof pressable>>;
type PressableFaceVariants = NonNullable<RecipeVariants<typeof pressableFace>>;

export type ButtonVariant = PressableVariants["variant"];
export type ButtonSize = PressableVariants["size"];
export type ButtonFormat = PressableFaceVariants["format"];
