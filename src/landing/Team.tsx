import { useGT } from "gt-tanstack-start";
import type { Teammate as Person } from "#app/brand/team";
import { Face, ProfileButton, roleColour, Tags } from "#app/status/Profile";
import { UsersThree } from "#app/ui/icons";
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

function Teammate({ member }: { member: Person }) {
  return (
    <li className={roleColour(member)}>
      <ProfileButton member={member} className={styles.member}>
        <Face name={member.name} avatar={member.avatar} size={styles.TILE_FACE} />
        <span className={styles.name}>{member.name}</span>
        <Tags tags={member.tags} />
      </ProfileButton>
    </li>
  );
}
