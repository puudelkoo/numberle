import type { GameMode } from "./modes";

export type ModeStats = {
  played: number;
  wins: number;
  losses: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<string, number>;
};

export type BotStats = {
  played: number;
  playerWins: number;
  botWins: number;
  noWinner: number;
  currentStreak: number;
  maxStreak: number;
  winDistribution: Record<string, number>;
};

export type NumberleStats = {
  version: 1;
  modes: Record<GameMode, ModeStats>;
  bot: BotStats;
  completedDailyKeys: string[];
};

type RecordGameParams = {
  mode: GameMode;
  isBotGame: boolean;
  result: "won" | "lost";
  lostByBot: boolean;
  completedRowIndex: number;
};

const STORAGE_KEY = "numberleStats";

// Puste statystyki

function emptyModeStats(): ModeStats {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},
  };
}

function emptyBotStats(): BotStats {
  return {
    played: 0,
    playerWins: 0,
    botWins: 0,
    noWinner: 0,
    currentStreak: 0,
    maxStreak: 0,
    winDistribution: {},
  };
}

export function createEmptyStats(): NumberleStats {
  return {
    version: 1,
    modes: {
      classic: emptyModeStats(),
      hard: emptyModeStats(),
      noRepeats: emptyModeStats(),
      daily: emptyModeStats(),
      mastermindEasy: emptyModeStats(),
      mastermindMedium: emptyModeStats(),
      mastermindHard: emptyModeStats(),
    },
    bot: emptyBotStats(),
    completedDailyKeys: [],
  };
}

// LocalStorage

export function loadStats(): NumberleStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStats();

    const parsed = JSON.parse(raw) as Partial<NumberleStats>;
    const empty = createEmptyStats();

    return {
      version: 1,
      modes: {
        ...empty.modes,
        ...(parsed.modes ?? {}),
      },
      bot: {
        ...empty.bot,
        ...(parsed.bot ?? {}),
      },
      completedDailyKeys: parsed.completedDailyKeys ?? [],
    };
  } catch {
    return createEmptyStats();
  }
}

export function saveStats(stats: NumberleStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// Daily

export function getWarsawDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

export function hasCompletedDailyToday(stats: NumberleStats) {
  return stats.completedDailyKeys.includes(getWarsawDateKey());
}

// Aktualizacja statystyk

function addDistributionValue(
  distribution: Record<string, number>,
  attempt: number,
) {
  const key = String(attempt);

  return {
    ...distribution,
    [key]: (distribution[key] ?? 0) + 1,
  };
}

function updateModeStats(
  stats: ModeStats,
  result: "won" | "lost",
  completedRowIndex: number,
): ModeStats {
  const next = { ...stats };

  next.played += 1;

  if (result === "won") {
    const attempt = Math.max(1, completedRowIndex);

    next.wins += 1;
    next.currentStreak += 1;
    next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
    next.guessDistribution = addDistributionValue(
      next.guessDistribution,
      attempt,
    );
  } else {
    next.losses += 1;
    next.currentStreak = 0;
  }

  return next;
}

function updateBotStats(
  stats: BotStats,
  result: "won" | "lost",
  lostByBot: boolean,
  completedRowIndex: number,
): BotStats {
  const next = { ...stats };

  next.played += 1;

  if (result === "won") {
    const playerAttempt = Math.max(1, Math.ceil(completedRowIndex / 2));

    next.playerWins += 1;
    next.currentStreak += 1;
    next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
    next.winDistribution = addDistributionValue(
      next.winDistribution,
      playerAttempt,
    );

    return next;
  }

  if (lostByBot) {
    next.botWins += 1;
  } else {
    next.noWinner += 1;
  }

  next.currentStreak = 0;
  return next;
}

export function recordCompletedGame(
  stats: NumberleStats,
  { mode, isBotGame, result, lostByBot, completedRowIndex }: RecordGameParams,
): NumberleStats {
  if (isBotGame) {
    return {
      ...stats,
      bot: updateBotStats(stats.bot, result, lostByBot, completedRowIndex),
    };
  }

  if (mode === "daily") {
    const dailyKey = getWarsawDateKey();

    if (stats.completedDailyKeys.includes(dailyKey)) {
      return stats;
    }

    return {
      ...stats,
      modes: {
        ...stats.modes,
        daily: updateModeStats(stats.modes.daily, result, completedRowIndex),
      },
      completedDailyKeys: [...stats.completedDailyKeys, dailyKey],
    };
  }

  return {
    ...stats,
    modes: {
      ...stats.modes,
      [mode]: updateModeStats(stats.modes[mode], result, completedRowIndex),
    },
  };
}
