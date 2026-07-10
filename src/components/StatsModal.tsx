import { useEffect, useMemo, useState } from "react";

import type { GameMode } from "../game/modes";
import { MODE_CONFIG } from "../game/modes";
import type { BotStats, ModeStats, NumberleStats } from "../game/stats";

import "./statsModal.css";

type StatsTab = GameMode | "bot";

type Props = {
  open: boolean;
  onClose: () => void;
  stats: NumberleStats;
};

type StatCard = {
  label: string;
  value: number;
};

const TABS: Array<{ id: StatsTab; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "classic", label: "Classic" },
  { id: "noRepeats", label: "No Repeats" },
  { id: "hard", label: "Hard" },
  { id: "mastermindEasy", label: "MM Easy" },
  { id: "mastermindMedium", label: "MM Medium" },
  { id: "mastermindHard", label: "MM Hard" },
  { id: "bot", label: "Bot" },
];

// Helpery

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getDistributionMax(distribution: Record<string, number>) {
  return Math.max(1, ...Object.values(distribution));
}

function getModeMaxAttempts(
  mode: GameMode,
  distribution: Record<string, number>,
) {
  const defaultLength = MODE_CONFIG[mode].defaultLength;
  const defaultTries = MODE_CONFIG[mode].triesForLength(defaultLength);

  const keys = Object.keys(distribution)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  return Math.max(defaultTries, ...keys, 1);
}

function getBotMaxAttempts(distribution: Record<string, number>) {
  const keys = Object.keys(distribution)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  return Math.max(6, ...keys);
}

// Kafelki statystyk

function StatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div className="stats-card" key={card.label}>
          <strong>{card.value}</strong>
          <span>{card.label}</span>
        </div>
      ))}
    </div>
  );
}

// Rozkład prób

function StatsBars({
  distribution,
  maxAttempts,
}: {
  distribution: Record<string, number>;
  maxAttempts: number;
}) {
  const maxValue = getDistributionMax(distribution);

  return (
    <div className="stats-bars">
      {Array.from({ length: maxAttempts }, (_, index) => {
        const attempt = index + 1;
        const value = distribution[String(attempt)] ?? 0;
        const width = `${Math.max(8, (value / maxValue) * 100)}%`;

        return (
          <div className="stats-bar-row" key={attempt}>
            <span className="stats-bar-label">{attempt}</span>

            <div className="stats-bar-track">
              <div className="stats-bar-fill" style={{ width }}>
                {value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Tryb gry

function ModeStatsView({ mode, stats }: { mode: GameMode; stats: ModeStats }) {
  const cards: StatCard[] = [
    { label: "Rozegrane", value: stats.played },
    { label: "Win %", value: percent(stats.wins, stats.played) },
    { label: "Seria", value: stats.currentStreak },
    { label: "Max seria", value: stats.maxStreak },
  ];

  const maxAttempts = getModeMaxAttempts(mode, stats.guessDistribution);

  return (
    <>
      <StatsCards cards={cards} />

      <section className="stats-section">
        <h3>Rozkład prób</h3>

        <StatsBars
          distribution={stats.guessDistribution}
          maxAttempts={maxAttempts}
        />
      </section>
    </>
  );
}

// Tryb bota

function BotStatsView({ stats }: { stats: BotStats }) {
  const cards: StatCard[] = [
    { label: "Rozegrane", value: stats.played },
    { label: "Win %", value: percent(stats.playerWins, stats.played) },
    { label: "Seria", value: stats.currentStreak },
    { label: "Max seria", value: stats.maxStreak },
  ];

  const maxAttempts = getBotMaxAttempts(stats.winDistribution);

  return (
    <>
      <StatsCards cards={cards} />

      <section className="stats-section">
        <h3>Wyniki vs bot</h3>

        <div className="stats-result-list">
          <div>
            <span>Twoje wygrane</span>
            <strong>{stats.playerWins}</strong>
          </div>

          <div>
            <span>Wygrane bota</span>
            <strong>{stats.botWins}</strong>
          </div>

          <div>
            <span>Nikt nie zgadł</span>
            <strong>{stats.noWinner}</strong>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h3>Twoje wygrane według próby</h3>

        <StatsBars
          distribution={stats.winDistribution}
          maxAttempts={maxAttempts}
        />
      </section>
    </>
  );
}

// Modal

export function StatsModal({ open, onClose, stats }: Props) {
  const [activeTab, setActiveTab] = useState<StatsTab>("daily");

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const title = useMemo(() => {
    if (activeTab === "bot") return "Bot";
    return MODE_CONFIG[activeTab].label;
  }, [activeTab]);

  if (!open) return null;

  return (
    <div className="stats-backdrop" onClick={onClose}>
      <section
        className="stats-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Statystyki"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="stats-header">
          <div>
            <h2 className="stats-title">Statystyki</h2>
            <p className="stats-subtitle">{title}</p>
          </div>

          <button
            className="stats-close"
            type="button"
            onClick={onClose}
            aria-label="Zamknij statystyki"
          >
            ✕
          </button>
        </header>

        <div className="stats-tabs" role="tablist" aria-label="Tryby">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`stats-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="stats-content">
          {activeTab === "bot" ? (
            <BotStatsView stats={stats.bot} />
          ) : (
            <ModeStatsView mode={activeTab} stats={stats.modes[activeTab]} />
          )}
        </div>
      </section>
    </div>
  );
}
