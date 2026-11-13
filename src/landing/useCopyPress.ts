import { useRef, useState, type MouseEvent } from "react";
import { spreadFromPress, type SpreadStart } from "#app/textures/Spread";
import { useCopy } from "#app/ui/copy/useCopy";

/**
 * A press on a copy card: it copies `text` and starts a spread where it landed, or from the
 * card's chip for a key press, which has no pointer.
 */
export function useCopyPress(text: string) {
  const { state, copy } = useCopy(text);
  const [spread, setSpread] = useState<SpreadStart>();
  const chip = useRef<HTMLSpanElement>(null);

  const press = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.parentElement!.getBoundingClientRect();
    setSpread(spreadFromPress(event, box, chip.current!.getBoundingClientRect()));
    void copy();
  };
  return { state, spread, chip, press };
}
