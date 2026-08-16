import { NotFound } from "#app/components/layout/NotFound";

/** Every path no other route claims. The page itself is a component, because
    dynamic routes render it too for a slug with no content behind it. */
export default function NotFoundRoute() {
  return <NotFound />;
}
