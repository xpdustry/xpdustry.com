import { useGT, useLocale, useMessages } from "gt-tanstack-start";
import { useId, type CSSProperties } from "react";
import { aboutIn, TAGS, type Teammate as Person } from "#app/brand/team";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { GitHub, UsersThree, X } from "#app/ui/icons";
import { outbound } from "#app/ui/outbound";
import { rem } from "#app/ui/styles/scale";
import { Tray } from "#app/ui/Tray";
import * as styles from "./Team.css";

/** Whoever holds a team role on Discord, highest first. */
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

/** What someone does, each in its colour. */
function Tags({ tags }: Pick<Person, "tags">) {
  const m = useMessages();
  return (
    <span className={styles.tags}>
      {tags.map((tag) => (
        <span key={tag} className={`${styles.tag} ${styles.rank[tag]}`}>
          {m(TAGS[tag])}
        </span>
      ))}
    </span>
  );
}

/** A teammate's face, or the first letter of their name for want of one. */
function Face({ name, avatar, size }: Pick<Person, "name" | "avatar"> & { size: number }) {
  const box = { width: size, height: size, fontSize: rem(size * 0.45) };
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
      {/[\p{L}\p{N}]/u.exec(name)?.[0]}
    </span>
  );
}

/** A teammate's tile, which opens their profile beside it. */
function Teammate({ member }: { member: Person }) {
  const id = useId();
  const anchor = { "--anchor": `--${id.replace(/\W/g, "")}` } as CSSProperties;
  return (
    <li className={styles.rank[member.tags[0]]} style={anchor}>
      <button type="button" className={styles.member} popoverTarget={`${id}-profile`}>
        <Face name={member.name} avatar={member.avatar} size={styles.FACE} />
        <span className={styles.name}>{member.name}</span>
        <Tags tags={member.tags} />
      </button>
      <Profile id={`${id}-profile`} member={member} />
    </li>
  );
}

/** A teammate's site, as its visitors type it. */
const address = (website: string) => new URL(website).host;

/** A teammate's profile: a card over the page, like Discord's, with where to find them. */
function Profile({ id, member }: { id: string; member: Person }) {
  const gt = useGT();
  const { name, accent, banner } = member;
  const top = {
    backgroundColor: accent,
    backgroundImage: banner && `url(${banner})`
  } satisfies CSSProperties;
  return (
    <div
      id={id}
      popover="auto"
      role="dialog"
      aria-labelledby={`${id}-name`}
      className={styles.profile}
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
      <Face name={name} avatar={member.avatar} size={80} />
      <p id={`${id}-name`} className={styles.title}>
        {name}
      </p>
      <Tags tags={member.tags} />
      <About member={member} />
      <Links member={member} />
    </div>
  );
}

/** Their line in the visitor's language, or in the default one for want of it. */
function About({ member }: { member: Person }) {
  const text = aboutIn(member, useLocale(), DEFAULT_LOCALE);
  return text ? <p className={styles.about}>{text}</p> : null;
}

/** Where to find them: their GitHub account, their site, either or neither. */
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
          {address(website)}
        </a>
      )}
    </span>
  );
}
