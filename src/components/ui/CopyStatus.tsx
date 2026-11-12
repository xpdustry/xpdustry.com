import { useGT } from "gt-tanstack-start";
import type { CopyState } from "#app/lib/useCopy";

/**
 * Tells screen readers how a copy of `text` went: `copied` once it landed (or "Copied {text}"),
 * and the text itself when the browser refused it.
 */
export function CopyStatus({
  state,
  text,
  copied,
}: {
  state: CopyState;
  text: string;
  copied?: string;
}) {
  const gt = useGT();
  return (
    <output className="sr-only">
      {state === "copied" && (copied ?? gt("Copied {text}", { text }))}
      {state === "failed" && gt("Could not copy. The address is {address}.", { address: text })}
    </output>
  );
}
