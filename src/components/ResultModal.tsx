import { useEffect } from "react";

import type { GameMode } from "../game/modes";
import { MODE_CONFIG } from "../game/modes";
import type { NumberleStats } from "../game/stats";

import "./resultModal.css";

type Props = {
  open: boolean;
  status: "won" | "lost";
  secret: string;

  mode: GameMode;
  isBotGame: boolean;
  lostByBot: boolean;

  rowIndex: number;
  maxTries: number;

  stats: NumberleStats;

  onClose: () => void;
  onNewGame: () => void;
  onOpenStats: () => void;
};

type StatCard = {
  label: string;
  value: number;
};

type AttemptParams = {
  rowIndex: number;
  isBotGame: boolean;
  status: "won" | "lost";
  lostByBot: boolean;
};

// Helpery

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getDistributionMax(distribution: Record<string, number>) {
  return Math.max(1, ...Object.values(distribution));
}

function getMaxAttemptsFromDistribution(
  maxTries: number,
  distribution: Record<string, number>,
) {
  const keys = Object.keys(distribution)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  return Math.max(maxTries, ...keys, 1);
}

function getModeLabel(mode: GameMode, isBotGame: boolean) {
  if (isBotGame) return "Bot";
  return MODE_CONFIG[mode].label;
}

function getAttemptLabel({
  rowIndex,
  isBotGame,
  status,
  lostByBot,
}: AttemptParams) {
  if (!isBotGame) {
    return Math.max(1, rowIndex);
  }

  if (status === "won" || lostByBot) {
    return Math.max(1, Math.ceil(rowIndex / 2));
  }

  return null;
}

function getResultTitle(
  status: "won" | "lost",
  isBotGame: boolean,
  lostByBot: boolean,
) {
  if (status === "won") {
    return isBotGame ? "Wygrałeś z botem" : "Wygrana";
  }

  if (isBotGame) {
    return lostByBot ? "Bot wygrał" : "Nikt nie zgadł";
  }

  return "Przegrana";
}

// Kafelki statystyk

function ResultStatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="result-stats-grid">
      {cards.map((card) => (
        <div key={card.label}>
          <strong>{card.value}</strong>
          <span>{card.label}</span>
        </div>
      ))}
    </div>
  );
}

// Rozkład prób

function ResultBars({
  distribution,
  maxAttempts,
}: {
  distribution: Record<string, number>;
  maxAttempts: number;
}) {
  const maxValue = getDistributionMax(distribution);

  return (
    <div className="result-bars">
      {Array.from({ length: maxAttempts }, (_, index) => {
        const attempt = index + 1;
        const value = distribution[String(attempt)] ?? 0;
        const width = `${Math.max(8, (value / maxValue) * 100)}%`;

        return (
          <div className="result-bar-row" key={attempt}>
            <span className="result-bar-label">{attempt}</span>

            <div className="result-bar-track">
              <div className="result-bar-fill" style={{ width }}>
                {value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Modal wyniku

export function ResultModal({
  open,
  status,
  secret,
  mode,
  isBotGame,
  lostByBot,
  rowIndex,
  maxTries,
  stats,
  onClose,
  onNewGame,
  onOpenStats,
}: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modeStats = isBotGame ? null : stats.modes[mode];
  const botStats = isBotGame ? stats.bot : null;

  const played = isBotGame ? (botStats?.played ?? 0) : (modeStats?.played ?? 0);
  const wins = isBotGame ? (botStats?.playerWins ?? 0) : (modeStats?.wins ?? 0);
  const currentStreak = isBotGame
    ? (botStats?.currentStreak ?? 0)
    : (modeStats?.currentStreak ?? 0);
  const maxStreak = isBotGame
    ? (botStats?.maxStreak ?? 0)
    : (modeStats?.maxStreak ?? 0);

  const distribution = isBotGame
    ? (botStats?.winDistribution ?? {})
    : (modeStats?.guessDistribution ?? {});

  const title = getResultTitle(status, isBotGame, lostByBot);
  const subtitle =
    status === "won"
      ? "Dobra robota — kod został odgadnięty."
      : "Gra zakończona. Spróbuj jeszcze raz.";

  const attempt = getAttemptLabel({
    rowIndex,
    isBotGame,
    status,
    lostByBot,
  });

  const cards: StatCard[] = [
    { label: "Rozegrane", value: played },
    { label: "Win %", value: percent(wins, played) },
    { label: "Seria", value: currentStreak },
    { label: "Max seria", value: maxStreak },
  ];

  const distributionAttempts = getMaxAttemptsFromDistribution(
    maxTries,
    distribution,
  );

  return (
    <div className="result-backdrop" onClick={onClose}>
      <section
        className="result-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Wynik gry"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="result-header">
          <div>
            <h2 className="result-title">
              {title} {status === "won" ? "✅" : "❌"}
            </h2>
            <p className="result-subtitle">{subtitle}</p>
          </div>

          <button
            className="result-close"
            type="button"
            onClick={onClose}
            aria-label="Zamknij wynik"
          >
            ✕
          </button>
        </header>

        <div className="result-content">
          <div className="result-secret">
            <span>Hasło</span>
            <strong>{secret}</strong>
          </div>

          <div className="result-meta">
            <div>
              <span>Tryb</span>
              <strong>{getModeLabel(mode, isBotGame)}</strong>
            </div>

            <div>
              <span>Próba</span>
              <strong>
                {attempt ? `${attempt}/${maxTries}` : `-/${maxTries}`}
              </strong>
            </div>
          </div>

          <section className="result-stats">
            <h3>Statystyki tego trybu</h3>
            <ResultStatsCards cards={cards} />
          </section>

          <section className="result-distribution">
            <h3>{isBotGame ? "Twoje wygrane według próby" : "Rozkład prób"}</h3>

            <ResultBars
              distribution={distribution}
              maxAttempts={distributionAttempts}
            />
          </section>

          {isBotGame && botStats && (
            <section className="result-bot-summary">
              <div>
                <span>Twoje wygrane</span>
                <strong>{botStats.playerWins}</strong>
              </div>

              <div>
                <span>Wygrane bota</span>
                <strong>{botStats.botWins}</strong>
              </div>

              <div>
                <span>Nikt nie zgadł</span>
                <strong>{botStats.noWinner}</strong>
              </div>
            </section>
          )}
        </div>

        <footer className="result-actions">
          <button
            className="result-action secondary"
            type="button"
            onClick={onOpenStats}
          >
            Statystyki
          </button>

          <button
            className="result-action primary"
            type="button"
            onClick={onNewGame}
          >
            Nowa gra
          </button>
        </footer>
      </section>
    </div>
  );
}
