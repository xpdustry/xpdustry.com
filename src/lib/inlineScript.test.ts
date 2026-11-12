import { expect, test } from "vitest";
import { inPage, inlineScript } from "#app/lib/inlineScript";

test("calls the function with serialized arguments and in-page expressions", () => {
  const script = inlineScript(
    (sink: string[], label: string, count: number) => {
      sink.push(`${label}:${count}`);
    },
    inPage("sink"),
    'a "quoted" label',
    3,
  );
  const sink: string[] = [];

  new Function("sink", script)(sink);

  expect(sink).toEqual(['a "quoted" label:3']);
});
