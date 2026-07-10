export type MastermindFeedback = {
  bulls: number; // cyfra i pozycja
  cows: number;  // cyfra jest, ale w innym miejscu
};

function countDigits(s: string): Record<string, number> {
  const c: Record<string, number> = {};
  for (const ch of s) c[ch] = (c[ch] ?? 0) + 1;
  return c;
}

export function getMastermindFeedback(guess: string, secret: string): MastermindFeedback {
  const len = Math.min(guess.length, secret.length);

  let bulls = 0;
  for (let i = 0; i < len; i++) {
    if (guess[i] === secret[i]) bulls++;
  }

  const gc = countDigits(guess.slice(0, len));
  const sc = countDigits(secret.slice(0, len));

  let matches = 0;
  for (const d of Object.keys(gc)) {
    matches += Math.min(gc[d], sc[d] ?? 0);
  }

  const cows = matches - bulls;
  return { bulls, cows };
}