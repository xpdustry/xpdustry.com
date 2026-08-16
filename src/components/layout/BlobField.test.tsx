import { render } from "@solidjs/testing-library";
import { describe, expect, test } from "vitest";
import {
  BAND_BOTTOM_BLOBS,
  BlobField,
  HERO_BLOBS,
  radialBlobPath,
} from "#app/components/layout/BlobField";

describe("radialBlobPath", () => {
  test("draws a deterministic smooth closed path through radial offsets", () => {
    const path = radialBlobPath([0, 0.12, -0.08, 0.06, -0.04, 0.1, -0.06, 0.03]);

    expect(path).toMatch(/^M /);
    expect(path).toContain(" C ");
    expect(path).toMatch(/ Z$/);
    expect(path).not.toContain("NaN");
  });
});

describe("<BlobField />", () => {
  test("renders an artwork's paths without live SVG effects", () => {
    const { container } = render(() => <BlobField artwork={HERO_BLOBS} />);

    expect(container.querySelectorAll("path").length).toBeGreaterThan(1);
    expect(container.querySelector(".blobfield__texture")).toBeInTheDocument();
    expect(container.querySelector("pattern image")).toHaveAttribute(
      "href",
      expect.stringContaining("grain-250.png"),
    );
    expect(container.querySelector("filter")).not.toBeInTheDocument();
    expect(container.querySelector("mask")).not.toBeInTheDocument();
    expect(container.querySelector("linearGradient")).not.toBeInTheDocument();
  });

  test("anchors a bottom-edge artwork", () => {
    const { container } = render(() => <BlobField artwork={BAND_BOTTOM_BLOBS} />);

    expect(container.querySelector(".blobfield")).toHaveClass("bottom-0", "top-auto");
  });
});
