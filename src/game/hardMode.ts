import type { FeedbackStatus } from "./types";

type HardConstraints = {
  fixed: Array<string | null>;            // zielone pozycje
  minCount: Record<string, number>;       // minimalna liczba wystąpień (zielone+żółte)
};

function countDigits(s: string): Record<string, number> {
  const c: Record<string, number> = {};
  for (const ch of s) c[ch] = (c[ch] ?? 0) + 1;
  return c;
}

export function buildHardConstraints(
  guesses: string[],
  feedbacks: FeedbackStatus[][],
  len: number
): HardConstraints {
  const fixed: Array<string | null> = Array.from({ length: len }, () => null);
  const minCount: Record<string, number> = {};

  for (let g = 0; g < guesses.length; g++) {
    const guess = guesses[g];
    const fb = feedbacks[g];
    if (!guess || !fb) continue;

    // Zielone pozycje
    for (let i = 0; i < len; i++) {
      if (fb[i] === "correct") fixed[i] = guess[i];
    }

    // Min count: ile było correct+present danej cyfry w tej próbie
    const cpCount: Record<string, number> = {};
    for (let i = 0; i < len; i++) {
      const d = guess[i];
      const s = fb[i];
      if (s === "correct" || s === "present") {
        cpCount[d] = (cpCount[d] ?? 0) + 1;
      }
    }

    // globalne minimum = max z dotychczasowych
    for (const d of Object.keys(cpCount)) {
      minCount[d] = Math.max(minCount[d] ?? 0, cpCount[d]);
    }
  }

  return { fixed, minCount };
}

export function validateHardGuess(guess: string, constraints: HardConstraints): string | null {
  const { fixed, minCount } = constraints;

  // zielone muszą zostać
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i] && guess[i] !== fixed[i]) {
      return `Hard mode: pozycja ${i + 1} musi być ${fixed[i]}`;
    }
  }

  const cnt = countDigits(guess);

  // żółte+zielone muszą się pojawić (w minimalnej liczbie)
  for (const d of Object.keys(minCount)) {
    if ((cnt[d] ?? 0) < minCount[d]) {
      return `Hard mode: musisz użyć cyfry ${d} min. ${minCount[d]}×`;
    }
  }

  return null;
}