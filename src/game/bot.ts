import type { FeedbackStatus } from "./types";
import { getFeedback } from "./feedback";

export type BotLevel = "off" | "easy" | "medium" | "hard";

export type BotMoveInfo = {
  guess: string;
  feedback: FeedbackStatus[];
};

type GetBotGuessParams = {
  level: BotLevel;
  length: number;
  moves: BotMoveInfo[];
  used: Set<string>;
};

const DIGITS = "0123456789";
const fullCodeCache = new Map<number, string[]>();

// Losowanie kodu

function randomCode(length: number): string {
  let out = "";

  for (let i = 0; i < length; i++) {
    out += DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }

  return out;
}

function randomUnused(length: number, used: Set<string>): string {
  for (let i = 0; i < 5000; i++) {
    const guess = randomCode(length);
    if (!used.has(guess)) return guess;
  }

  return randomCode(length);
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// Kandydaci

function generateAllCodes(length: number): string[] {
  const cached = fullCodeCache.get(length);
  if (cached) return cached;

  const total = 10 ** length;
  const codes: string[] = [];

  for (let i = 0; i < total; i++) {
    codes.push(String(i).padStart(length, "0"));
  }

  fullCodeCache.set(length, codes);
  return codes;
}

function sameFeedback(a: FeedbackStatus[], b: FeedbackStatus[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((status, i) => status === b[i]);
}

function matchesPublicMoves(
  candidateSecret: string,
  moves: BotMoveInfo[],
): boolean {
  return moves.every((move) => {
    const expectedFeedback = getFeedback(move.guess, candidateSecret);
    return sameFeedback(expectedFeedback, move.feedback);
  });
}

function getExactCandidates(
  length: number,
  moves: BotMoveInfo[],
  used: Set<string>,
): string[] {
  return generateAllCodes(length).filter(
    (candidate) => !used.has(candidate) && matchesPublicMoves(candidate, moves),
  );
}

function getSampleCandidates(
  length: number,
  moves: BotMoveInfo[],
  used: Set<string>,
  targetCount: number,
): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const maxAttempts = targetCount * 300;

  for (let i = 0; i < maxAttempts && candidates.length < targetCount; i++) {
    const candidate = randomCode(length);

    if (used.has(candidate)) continue;
    if (seen.has(candidate)) continue;

    seen.add(candidate);

    if (matchesPublicMoves(candidate, moves)) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function getCandidates(
  length: number,
  moves: BotMoveInfo[],
  used: Set<string>,
  limitForLongCodes = 1200,
): string[] {
  if (length <= 5) {
    return getExactCandidates(length, moves, used);
  }

  return getSampleCandidates(length, moves, used, limitForLongCodes);
}

// Poziom Medium

function getMediumGuess(
  length: number,
  moves: BotMoveInfo[],
  used: Set<string>,
): string {
  const candidates = getCandidates(length, moves, used);

  if (candidates.length > 0) {
    return pickRandom(candidates);
  }

  return randomUnused(length, used);
}

// Poziom Hard

function feedbackKey(feedback: FeedbackStatus[]): string {
  return feedback.join("|");
}

function scoreGuess(guess: string, possibleSecrets: string[]): number {
  const buckets = new Map<string, number>();

  for (const secretCandidate of possibleSecrets) {
    const fb = getFeedback(guess, secretCandidate);
    const key = feedbackKey(fb);

    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  let worstBucket = 0;

  for (const size of buckets.values()) {
    if (size > worstBucket) worstBucket = size;
  }

  return worstBucket;
}

function getHardGuess(
  length: number,
  moves: BotMoveInfo[],
  used: Set<string>,
): string {
  const candidates = getCandidates(length, moves, used, 1600);

  if (candidates.length === 0) {
    return randomUnused(length, used);
  }

  if (candidates.length <= 2) {
    return pickRandom(candidates);
  }

  const possibleSecrets =
    candidates.length > 350 ? shuffle(candidates).slice(0, 350) : candidates;

  const guessesToScore =
    candidates.length > 220 ? shuffle(candidates).slice(0, 220) : candidates;

  let bestGuess = guessesToScore[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const guess of guessesToScore) {
    const score = scoreGuess(guess, possibleSecrets);

    if (score < bestScore) {
      bestScore = score;
      bestGuess = guess;
    }
  }

  return bestGuess;
}

// Wybór ruchu

export function getBotGuess({
  level,
  length,
  moves,
  used,
}: GetBotGuessParams): string {
  if (level === "off") {
    return randomUnused(length, used);
  }

  if (level === "easy") {
    const shouldThink = Math.random() < 0.25;

    if (!shouldThink) {
      return randomUnused(length, used);
    }

    return getMediumGuess(length, moves, used);
  }

  if (level === "medium") {
    return getMediumGuess(length, moves, used);
  }

  return getHardGuess(length, moves, used);
}
