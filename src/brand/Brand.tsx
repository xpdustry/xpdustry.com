import { Link } from "@tanstack/react-router";
import logo from "./logo.svg";
import { SITE } from "./site";
import * as styles from "./Brand.css";

export function Brand({ className, linked = true }: { className?: string; linked?: boolean }) {
  const look = `${styles.brand} ${className ?? ""}`;
  const mark = (
    <>
      <img src={logo} alt="" width="40" height="40" />
      <span>{SITE.name}</span>
    </>
  );
  return linked ? (
    <Link to="/" className={look}>
      {mark}
    </Link>
  ) : (
    <div className={look}>{mark}</div>
  );
}
