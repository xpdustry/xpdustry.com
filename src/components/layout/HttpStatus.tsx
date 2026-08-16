import { getRequestEvent, isServer } from "@solidjs/web";

/**
 * Sets the SSR response status for a page that renders but is not a 200.
 *
 * Without it the 404 page comes back as 200, which tells crawlers and
 * monitors that a missing URL is a real one. On the client it is a no-op:
 * the status was decided when the document was served.
 */
export function HttpStatus(props: { code: number }) {
  if (isServer) {
    const event = getRequestEvent();
    if (event && !event.response.committed) event.response.status = props.code;
  }
  return null;
}
