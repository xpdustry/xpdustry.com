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
