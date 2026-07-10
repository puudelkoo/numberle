import type { FeedbackStatus  } from "./types";

export function getFeedback(guess: string, secret: string): FeedbackStatus[] {
  const g = guess.toUpperCase().split("");
  const s = secret.toUpperCase().split("");

  const result: FeedbackStatus[] = Array(g.length).fill("absent");

  // PASS 1: correct (zielone)
  for (let i = 0; i < g.length; i++) {
    if (g[i] === s[i]) {
      result[i] = "correct";
      s[i] = "_"; // zużyta litera
    }
  }

  // PASS 2: present (żółte)
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;

    const idx = s.indexOf(g[i]);
    if (idx !== -1) {
      result[i] = "present";
      s[idx] = "_";
    }
  }

  return result;
}