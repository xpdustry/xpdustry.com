import { useRef, useState, type MouseEvent } from "react";
import { spreadFromPress, type SpreadStart } from "#app/textures/Spread";
import { useCopy } from "#app/ui/copy/useCopy";

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
