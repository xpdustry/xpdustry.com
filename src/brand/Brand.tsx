import { Link } from "@tanstack/react-router";
import logo from "./logo.svg";
import { SITE } from "./site";
import * as styles from "./Brand.css";

/** The logo and the name, home. Size it with the `mark` and `name` vars of `Brand.css` on `className`. */
export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" className={`${styles.brand} ${className ?? ""}`}>
      <img src={logo} alt="" width="40" height="40" />
      <span>{SITE.name}</span>
    </Link>
  );
}
