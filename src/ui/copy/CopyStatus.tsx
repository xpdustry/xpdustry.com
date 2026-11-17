import { useGT } from "gt-tanstack-start";
import type { CopyState } from "./useCopy";

export function CopyStatus({
  state,
  text,
  copiedMessage
}: {
  state: CopyState;
  text: string;
  copiedMessage?: string;
}) {
  const gt = useGT();
  return (
    <output className="sr-only">
      {state === "copied" && (copiedMessage ?? gt("Copied {text}", { text }))}
      {state === "failed" && gt("Could not copy. The address is {address}.", { address: text })}
    </output>
  );
}
