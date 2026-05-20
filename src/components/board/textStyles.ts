import { TLDefaultSizeStyle } from "tldraw";

export const TEXT_SIZE_OPTIONS = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54,
  60, 66, 72,
];

export const BASE_TEXT_SIZES: Record<TLDefaultSizeStyle, number> = {
  s: 18,
  m: 24,
  l: 36,
  xl: 44,
};

export function getMappedTextSize(fontSize: number): {
  size: TLDefaultSizeStyle;
  scale: number;
} {
  if (fontSize <= BASE_TEXT_SIZES.s) {
    return { size: "s", scale: fontSize / BASE_TEXT_SIZES.s };
  }
  if (fontSize <= BASE_TEXT_SIZES.m) {
    return { size: "m", scale: fontSize / BASE_TEXT_SIZES.m };
  }
  if (fontSize <= BASE_TEXT_SIZES.l) {
    return { size: "l", scale: fontSize / BASE_TEXT_SIZES.l };
  }
  return { size: "xl", scale: fontSize / BASE_TEXT_SIZES.xl };
}

export function getShapeTextSize(shape: unknown, fallback: number): number {
  if (!shape || typeof shape !== "object" || !("props" in shape)) return fallback;
  const props = (shape as { props: Record<string, unknown> }).props;
  const size = props.size as TLDefaultSizeStyle | undefined;
  const scale = typeof props.scale === "number" ? props.scale : 1;
  if (!size) return fallback;
  return Math.max(8, Math.round(BASE_TEXT_SIZES[size] * scale));
}
