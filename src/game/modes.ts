export type GameMode =
  | "classic"
  | "hard"
  | "noRepeats"
  | "daily"
  | "mastermindEasy"
  | "mastermindMedium"
  | "mastermindHard";

export type FeedbackKind = "wordle" | "mastermind";

export type ModeConfig = {
  label: string;

  lockLength: boolean;

  defaultLength: number;
  minLength: number;
  maxLength: number;

  triesForLength: (len: number) => number;

  feedback: FeedbackKind;
  allowRepeats: boolean;
  isDaily: boolean;
};

// Konfiguracja trybów

export const MODE_CONFIG: Record<GameMode, ModeConfig> = {
  classic: {
    label: "Classic",
    lockLength: false,
    defaultLength: 5,
    minLength: 4,
    maxLength: 7,
    triesForLength: (len) => len + 1,
    feedback: "wordle",
    allowRepeats: true,
    isDaily: false,
  },

  hard: {
    label: "Hard",
    lockLength: false,
    defaultLength: 5,
    minLength: 4,
    maxLength: 7,
    triesForLength: (len) => len + 2,
    feedback: "wordle",
    allowRepeats: true,
    isDaily: false,
  },

  noRepeats: {
    label: "No Repeats",
    lockLength: false,
    defaultLength: 5,
    minLength: 4,
    maxLength: 6,
    triesForLength: (len) => len,
    feedback: "wordle",
    allowRepeats: false,
    isDaily: false,
  },

  daily: {
    label: "Daily",
    lockLength: true,
    defaultLength: 5,
    minLength: 5,
    maxLength: 5,
    triesForLength: () => 6,
    feedback: "wordle",
    allowRepeats: true,
    isDaily: true,
  },

  mastermindEasy: {
    label: "Mastermind Easy",
    lockLength: true,
    defaultLength: 4,
    minLength: 4,
    maxLength: 4,
    triesForLength: () => 7,
    feedback: "mastermind",
    allowRepeats: true,
    isDaily: false,
  },

  mastermindMedium: {
    label: "Mastermind Medium",
    lockLength: true,
    defaultLength: 5,
    minLength: 5,
    maxLength: 5,
    triesForLength: () => 8,
    feedback: "mastermind",
    allowRepeats: true,
    isDaily: false,
  },

  mastermindHard: {
    label: "Mastermind Hard",
    lockLength: true,
    defaultLength: 6,
    minLength: 6,
    maxLength: 6,
    triesForLength: () => 10,
    feedback: "mastermind",
    allowRepeats: true,
    isDaily: false,
  },
} as const;

// Helpery trybów

export function clampLength(mode: GameMode, len: number): number {
  const cfg = MODE_CONFIG[mode];
  return Math.max(cfg.minLength, Math.min(cfg.maxLength, len));
}

export function getDefaultLength(mode: GameMode): number {
  return MODE_CONFIG[mode].defaultLength;
}

export function getTries(mode: GameMode, len: number): number {
  const L = clampLength(mode, len);
  return MODE_CONFIG[mode].triesForLength(L);
}

export function isMastermind(mode: GameMode): boolean {
  return MODE_CONFIG[mode].feedback === "mastermind";
}

export function isDaily(mode: GameMode): boolean {
  return MODE_CONFIG[mode].isDaily;
}

export function allowsRepeats(mode: GameMode): boolean {
  return MODE_CONFIG[mode].allowRepeats;
}
