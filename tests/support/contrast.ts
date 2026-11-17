export type Rgb = readonly number[];

export const rgb = (hex: string): Rgb => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));

export function wcagLuminance(colour: Rgb): number {
  const [r, g, b] = colour.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function wcagContrast(one: Rgb, other: Rgb): number {
  const [light, dark] = [wcagLuminance(one), wcagLuminance(other)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
}
