import { render } from "@solidjs/testing-library";
import { describe, expect, test } from "vitest";
import { ReticulateField } from "#app/components/layout/ReticulateField";

describe("<ReticulateField />", () => {
  test("renders the baked tile as a mask, with no live effects", () => {
    const { container } = render(() => <ReticulateField />);

    const net = container.querySelector<HTMLElement>(".reticulate__net");
    expect(net).toBeInTheDocument();
    expect(net?.style.maskImage).toContain("reticulate.png");
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(container.querySelector("filter")).not.toBeInTheDocument();
  });
});
