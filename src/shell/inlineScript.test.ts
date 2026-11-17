import { runInNewContext } from "node:vm";
import { expect, test } from "vitest";
import { inPage, inlineScript } from "./inlineScript";

test("calls the function with serialized arguments and in-page expressions", () => {
  const script = inlineScript(
    "(sink, label, count) => { sink.push(`${label}:${count}`); }",
    inPage("sink"),
    'a "quoted" label',
    3
  );
  const sink: string[] = [];

  // Running the script is the point: it is what the browser does with the inline tag.
  // oxlint-disable-next-line typescript/no-implied-eval
  new Function("sink", script)(sink);

  expect(sink).toEqual(['a "quoted" label:3']);
});

test("an argument cannot close the script tag it is written into", () => {
  const closing = "</script><script>alert(1)</script>";
  const script = inlineScript("(text) => text", closing);

  expect(script).not.toContain("</script");
  expect(runInNewContext(script)).toBe(closing);
});
