type ClassValue = string | number | false | null | undefined;

/** Tiny className joiner (avoids an extra dependency). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
