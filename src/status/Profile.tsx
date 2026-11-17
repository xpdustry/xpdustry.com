import { assignInlineVars } from "@vanilla-extract/dynamic";
import { msg, useGT, useLocale, useMessages } from "gt-tanstack-start";
import { useId, type CSSProperties, type ReactNode } from "react";
import { aboutIn, type Tag, type Teammate } from "#app/brand/team";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { GitHub, X } from "#app/ui/icons";
import { outbound } from "#app/ui/outbound";
import { animateOnToggle } from "#app/ui/popoverMotion";
import { rem } from "#app/ui/styles/scale";
import * as styles from "./Profile.css";

export const roleColour = (member: Teammate) => member.tags[0] && styles.roleColour[member.tags[0]];

export function ProfileButton({
  member,
  className,
  label,
  children
}: {
  member: Teammate;
  className: string;
  label?: string;
  children: ReactNode;
}) {
  const id = useId();
  const profile = `${id}-profile`;
  const anchor = assignInlineVars({ [styles.anchor]: `--${id.replace(/\W/g, "")}` });
  return (
    <>
      <button
        type="button"
        className={`${styles.opener} ${className}`}
        style={anchor}
        popoverTarget={profile}
        aria-label={label}
      >
        {children}
      </button>
      <Profile id={profile} member={member} style={anchor} />
    </>
  );
}

const TAG_LABELS = {
  owner: msg("Owner"),
  developer: msg("Developer"),
  admin: msg("Admin"),
  moderator: msg("Moderator")
} satisfies Record<Tag, unknown>;

export function Tags({ tags }: Pick<Teammate, "tags">) {
  const m = useMessages();
  return (
    <span className={styles.tags}>
      {tags.map((tag) => (
        <span key={tag} className={`${styles.tag} ${styles.roleColour[tag]}`}>
          {m(TAG_LABELS[tag])}
        </span>
      ))}
    </span>
  );
}

const INITIAL_SCALE = 0.45;

const initial = (name: string) => /[\p{L}\p{N}]/u.exec(name)?.[0];

export function Face({ name, avatar, size }: Pick<Teammate, "name" | "avatar"> & { size: number }) {
  const box = { width: size, height: size, fontSize: rem(size * INITIAL_SCALE) };
  return avatar ? (
    <img
      className={styles.face}
      style={box}
      src={avatar}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className={styles.face} style={box} aria-hidden="true">
      {initial(name)}
    </span>
  );
}

function Profile({ id, member, style }: { id: string; member: Teammate; style: CSSProperties }) {
  const gt = useGT();
  const { name, accent, banner } = member;
  const top = {
    backgroundColor: accent,
    backgroundImage: banner && `url(${banner})`
  } satisfies CSSProperties;
  return (
    <dialog
      id={id}
      popover="auto"
      aria-labelledby={`${id}-name`}
      className={`${styles.profile} ${roleColour(member) ?? ""}`}
      style={style}
      ref={shutWhenFocusLeaves}
      {...animateOnToggle}
    >
      <div className={styles.sheet}>
        <div className={styles.banner} style={top} />
        <button
          type="button"
          className={styles.close}
          popoverTarget={id}
          popoverTargetAction="hide"
          aria-label={gt("Close")}
        >
          <X />
        </button>
        <Face name={name} avatar={member.avatar} size={styles.PROFILE_FACE} />
        <p id={`${id}-name`} className={styles.title}>
          {name}
        </p>
        <Tags tags={member.tags} />
        <About member={member} />
        <Links member={member} />
      </div>
    </dialog>
  );
}

function shutWhenFocusLeaves(profile: HTMLDialogElement) {
  const shut = ({ relatedTarget: next }: FocusEvent) => {
    if (!(next instanceof Node) || profile.contains(next)) return;
    setTimeout(() => {
      if (profile.matches(":popover-open") && !profile.contains(document.activeElement)) {
        profile.hidePopover();
      }
    });
  };
  profile.addEventListener("focusout", shut);
  return () => profile.removeEventListener("focusout", shut);
}

function About({ member }: { member: Teammate }) {
  const text = aboutIn(member, useLocale(), DEFAULT_LOCALE);
  return text ? <p className={styles.about}>{text}</p> : null;
}

function Links({ member: { github, website } }: { member: Teammate }) {
  return (
    <span className={styles.links}>
      {github && (
        <a href={github} {...outbound(github)}>
          <GitHub />
          GitHub
        </a>
      )}
      {website && (
        <a href={website} {...outbound(website)}>
          {new URL(website).host}
        </a>
      )}
    </span>
  );
}
