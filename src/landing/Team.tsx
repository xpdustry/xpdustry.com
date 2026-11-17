import { msg, useGT, useLocale, useMessages } from "gt-tanstack-start";
import { useId, type CSSProperties } from "react";
import { aboutIn, type Tag, type Teammate as Person } from "#app/brand/team";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { GitHub, UsersThree, X } from "#app/ui/icons";
import { outbound } from "#app/ui/outbound";
import { animateOnToggle } from "#app/ui/popoverMotion";
import { rem } from "#app/ui/styles/scale";
import { Tray } from "#app/ui/Tray";
import * as styles from "./Team.css";

export function Team({ team }: { team: Person[] }) {
  const gt = useGT();
  return (
    <Tray
      id="team"
      icon={UsersThree}
      title={gt("Team")}
      subtitle={gt("The people behind Xpdustry and its servers")}
    >
      <ul className={styles.members}>
        {team.map((person) => (
          <Teammate key={person.id} member={person} />
        ))}
      </ul>
    </Tray>
  );
}

const TAG_LABELS = {
  owner: msg("Owner"),
  developer: msg("Developer"),
  admin: msg("Admin"),
  moderator: msg("Moderator")
} satisfies Record<Tag, unknown>;

function Tags({ tags }: Pick<Person, "tags">) {
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

function Face({ name, avatar, size }: Pick<Person, "name" | "avatar"> & { size: number }) {
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

function Teammate({ member }: { member: Person }) {
  const id = useId();
  const anchor = { "--anchor": `--${id.replace(/\W/g, "")}` } as CSSProperties;
  return (
    <li className={styles.roleColour[member.tags[0]]} style={anchor}>
      <button type="button" className={styles.member} popoverTarget={`${id}-profile`}>
        <Face name={member.name} avatar={member.avatar} size={styles.TILE_FACE} />
        <span className={styles.name}>{member.name}</span>
        <Tags tags={member.tags} />
      </button>
      <Profile id={`${id}-profile`} member={member} />
    </li>
  );
}

function Profile({ id, member }: { id: string; member: Person }) {
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
      className={styles.profile}
      {...animateOnToggle}
    >
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
    </dialog>
  );
}

function About({ member }: { member: Person }) {
  const text = aboutIn(member, useLocale(), DEFAULT_LOCALE);
  return text ? <p className={styles.about}>{text}</p> : null;
}

function Links({ member: { github, website } }: { member: Person }) {
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
