/** A hostname that, if it has to wrap, breaks before its domain: "hub.md." over "xpdustry.com". */
export function Hostname({ name }: { name: string }) {
  const labels = name.split(".");
  if (labels.length < 3) return name;
  return (
    <>
      {labels.slice(0, -2).join(".")}.<wbr />
      {labels.slice(-2).join(".")}
    </>
  );
}
