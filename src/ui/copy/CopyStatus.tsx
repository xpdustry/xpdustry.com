import { useGT } from "gt-tanstack-start";
import type { CopyOutcome } from "./useCopy";

export function CopyStatus({
  outcome,
  text,
  copiedMessage
}: {
  outcome: CopyOutcome | undefined;
  text: string;
  copiedMessage?: string;
}) {
  const gt = useGT();
  return (
    <output className="sr-only">
      {outcome === "copied" && (copiedMessage ?? gt("Copied {text}", { text }))}
      {outcome === "failed" && gt("Could not copy. The address is {address}.", { address: text })}
    </output>
  );
}
