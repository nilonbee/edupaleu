/**
 * Utility function to merge classNames together
 * Simple implementation that concatenates classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

