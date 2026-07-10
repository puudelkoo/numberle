export function hasNoRepeats(s: string): boolean {
  return new Set(s.split("")).size === s.length;
}