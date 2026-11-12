import { Link } from "@tanstack/react-router";
import logo from "#app/assets/logo.svg";
import { SITE } from "#app/data/site";
import styles from "./Brand.module.css";

/** The logo and the name, home. Size it with `--mark` and `--name` on `className`. */
export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" className={`${styles.brand} ${className ?? ""}`}>
      <img src={logo} alt="" width="40" height="40" />
      <span>{SITE.name}</span>
    </Link>
  );
}
