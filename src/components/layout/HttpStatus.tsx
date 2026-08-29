import { getRequestEvent, isServer } from "@solidjs/web";

// Set the status during SSR; client navigation cannot change the served response.
export function HttpStatus(props: { code: number }) {
  if (isServer) {
    const event = getRequestEvent();
    if (event && !event.response.committed) event.response.status = props.code;
  }
  return null;
}
