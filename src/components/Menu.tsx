import { useEffect, useRef, useState } from "react";
import "./menu.css";

import type { GameMode } from "../game/modes";
import {
  MODE_CONFIG,
  clampLength,
  getTries,
  isDaily,
  isMastermind,
} from "../game/modes";

type BotLevel = "off" | "easy" | "medium" | "hard";
type Flyout = "none" | "mastermind" | "bot" | "settings";

type Props = {
  open: boolean;
  onClose: () => void;

  onNewGame: () => void;
  onRestart: () => void;

  onOpenRules: () => void;
  onOpenStats: () => void;

  mode: GameMode;
  onModeChange: (m: GameMode) => void;

  wordLength: number;
  onWordLengthChange: (n: number) => void;

  maxTries: number;

  theme: "light" | "dark";
  onThemeChange: (t: "light" | "dark") => void;

  botLevel?: BotLevel;
  onBotLevelChange?: (b: BotLevel) => void;
};

const WORDLE_MODES: GameMode[] = ["daily", "classic", "noRepeats", "hard"];

const MASTERMIND_MODES: GameMode[] = [
  "mastermindEasy",
  "mastermindMedium",
  "mastermindHard",
];

const BOT_LEVELS: BotLevel[] = ["off", "easy", "medium", "hard"];

function modeLabel(mode: GameMode) {
  switch (mode) {
    case "classic":
      return "Classic";
    case "noRepeats":
      return "No Repeats";
    case "hard":
      return "Hard";
    case "daily":
      return "Daily";
    case "mastermindEasy":
      return "Easy";
    case "mastermindMedium":
      return "Medium";
    case "mastermindHard":
      return "Hard";
    default:
      return String(mode);
  }
}

function modeDesc(mode: GameMode) {
  if (mode === "classic") return "Klasyczne zasady.";
  if (mode === "hard") return "Musisz używać odkrytych cyfr.";
  if (mode === "noRepeats") return "Cyfry nie mogą się powtarzać.";
  if (mode === "daily") return "Jedna zagadka dziennie.";
  if (isMastermind(mode)) return "Feedback: bulls / cows.";
  return "";
}

function botLabel(level: BotLevel) {
  if (level === "off") return "Off";
  return `${level[0].toUpperCase()}${level.slice(1)}`;
}

function botDesc(level: BotLevel) {
  if (level === "off") return "Grasz sam.";
  if (level === "easy") return "Luźne wybory.";
  if (level === "medium") return "Analiza feedbacku.";
  if (level === "hard") return "Mocna gra.";
  return "";
}

export function Menu({
  open,
  onClose,
  onNewGame,
  onRestart,
  onOpenRules,
  onOpenStats,
  mode,
  onModeChange,
  wordLength,
  onWordLengthChange,
  theme,
  onThemeChange,
  botLevel = "off",
  onBotLevelChange,
}: Props) {
  // Dane menu

  const cfg = MODE_CONFIG[mode];
  const lengthLocked = cfg.lockLength;

  const shownLength = clampLength(mode, wordLength);
  const shownTries = getTries(mode, shownLength);
  const mmActive = isMastermind(mode);

  // Flyouty

  const drawerRef = useRef<HTMLElement | null>(null);
  const mmRef = useRef<HTMLButtonElement | null>(null);
  const botRef = useRef<HTMLButtonElement | null>(null);
  const settingsRef = useRef<HTMLButtonElement | null>(null);

  const [flyout, setFlyout] = useState<Flyout>("none");
  const [flyoutTop, setFlyoutTop] = useState(0);

  function closeFlyout() {
    setFlyout("none");
  }

  function toggleFlyout(nextFlyout: Flyout) {
    if (nextFlyout === "none") return;
    setFlyout((current) => (current === nextFlyout ? "none" : nextFlyout));
  }

  function closeMenu() {
    closeFlyout();
    onClose();
  }

  function openRules() {
    closeFlyout();
    onOpenRules();
  }

  function openStats() {
    closeFlyout();
    onOpenStats();
  }

  // Pozycja flyoutu

  useEffect(() => {
    if (flyout === "none") return;

    const target =
      flyout === "mastermind"
        ? mmRef.current
        : flyout === "bot"
          ? botRef.current
          : settingsRef.current;

    const drawer = drawerRef.current;

    if (!target || !drawer) return;

    const targetRect = target.getBoundingClientRect();
    const drawerRect = drawer.getBoundingClientRect();

    setFlyoutTop(Math.max(12, targetRect.top - drawerRect.top));
  }, [flyout, open]);

  // Klawiatura

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (flyout !== "none") closeFlyout();
        else if (open) closeMenu();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flyout, open]);

  return (
    <>
      {open && (
        <div
          className="menu-backdrop"
          onClick={() => {
            if (flyout !== "none") closeFlyout();
            else closeMenu();
          }}
        />
      )}

      <aside
        ref={drawerRef}
        className={`menu-drawer ${open ? "open" : ""}`}
        aria-label="menu"
      >
        <div className="menu-header">
          <div className="menu-title">Menu</div>

          <button
            className="menu-close"
            onClick={closeMenu}
            type="button"
            aria-label="close menu"
          >
            ✕
          </button>
        </div>

        <div className="menu-top-actions">
          <button className="menu-action" onClick={onNewGame} type="button">
            Nowa gra
          </button>

          <button className="menu-action" onClick={onRestart} type="button">
            Restart
          </button>
        </div>

        <div className="menu-divider" />

        <div className="menu-body">
          <div className="menu-section">
            <div className="menu-section-title">TRYB GRY</div>

            <div className="menu-subsection-title">Wordle</div>

            <div className="menu-list">
              {WORDLE_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`menu-item ${mode === m ? "active" : ""}`}
                  onClick={() => onModeChange(m)}
                >
                  <div className="menu-item-main">
                    <div className="menu-item-title">{modeLabel(m)}</div>
                    <div className="menu-item-desc">{modeDesc(m)}</div>
                  </div>

                  <div className="menu-item-mark" aria-hidden="true" />
                </button>
              ))}
            </div>

            <button
              ref={mmRef}
              type="button"
              className={`menu-nav ${
                flyout === "mastermind" ? "active" : ""
              } ${mmActive ? "has-active" : ""}`}
              onClick={() => toggleFlyout("mastermind")}
            >
              <div className="menu-item-main">
                <div className="menu-item-title">Mastermind</div>
                <div className="menu-item-desc">Bulls & cows.</div>
              </div>

              <div className="menu-nav-right">
                {mmActive ? "•" : ""}
                <span className="chev" aria-hidden="true">
                  ›
                </span>
              </div>
            </button>
          </div>

          <div className="menu-section">
            <button
              ref={botRef}
              type="button"
              className={`menu-nav ${flyout === "bot" ? "active" : ""} ${
                botLevel !== "off" ? "has-active" : ""
              }`}
              onClick={() => toggleFlyout("bot")}
            >
              <div className="menu-item-main">
                <div className="menu-item-title">BOT</div>
                <div className="menu-item-desc">Pojedynek z botem.</div>
              </div>

              <div className="menu-nav-right">
                {botLevel !== "off" ? "•" : ""}
                <span className="chev" aria-hidden="true">
                  ›
                </span>
              </div>
            </button>
          </div>

          <div className="menu-section">
            <button
              ref={settingsRef}
              type="button"
              className={`menu-nav ${flyout === "settings" ? "active" : ""}`}
              onClick={() => toggleFlyout("settings")}
            >
              <span>Ustawienia</span>

              <span className="menu-nav-right">
                <span className="chev" aria-hidden="true">
                  ›
                </span>
              </span>
            </button>
          </div>

          <div className="menu-section">
            <div className="menu-section-title">INFO</div>

            <button
              className="menu-link menu-link--active"
              type="button"
              onClick={openRules}
            >
              Zasady
            </button>

            <button
              className="menu-link menu-link--active"
              type="button"
              onClick={openStats}
            >
              Statystyki
            </button>
          </div>
        </div>

        <div className="menu-footer">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          >
            <span className="theme-dot" aria-hidden="true" />

            <span className="theme-text">
              {theme === "light" ? "Light" : "Dark"}
            </span>

            <span className="theme-pill">{theme === "light" ? "☀" : "🌙"}</span>
          </button>

          <div className="menu-footer-note">Numberle</div>
        </div>

        {flyout !== "none" && (
          <div
            className="menu-flyout"
            style={{ top: flyoutTop }}
            role="dialog"
            aria-label="submenu"
          >
            <div className="flyout-header">
              <div className="flyout-title">
                {flyout === "mastermind" && "Mastermind"}
                {flyout === "bot" && "BOT"}
                {flyout === "settings" && "Ustawienia"}
              </div>

              <button
                className="flyout-close"
                type="button"
                onClick={closeFlyout}
                aria-label="close submenu"
              >
                ✕
              </button>
            </div>

            <div className="flyout-body">
              {flyout === "mastermind" && (
                <div className="menu-list">
                  {MASTERMIND_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`menu-item ${mode === m ? "active" : ""}`}
                      onClick={() => onModeChange(m)}
                    >
                      <div className="menu-item-main">
                        <div className="menu-item-title">{modeLabel(m)}</div>
                        <div className="menu-item-desc">{modeDesc(m)}</div>
                      </div>

                      <div className="menu-item-mark" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {flyout === "bot" && (
                <div className="menu-list">
                  {BOT_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`menu-item ${
                        botLevel === level ? "active" : ""
                      }`}
                      onClick={() => onBotLevelChange?.(level)}
                      disabled={!onBotLevelChange}
                    >
                      <div className="menu-item-main">
                        <div className="menu-item-title">{botLabel(level)}</div>

                        <div className="menu-item-desc">{botDesc(level)}</div>
                      </div>

                      <div className="menu-item-mark" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {flyout === "settings" && (
                <div className="settings-block">
                  <div className="settings-row">
                    <div className="settings-label">Długość kodu</div>
                    <div className="settings-value">{shownLength}</div>
                  </div>

                  {lengthLocked ? (
                    <div className="settings-note">
                      Ten tryb ma stałą długość.
                    </div>
                  ) : (
                    <input
                      className="settings-slider"
                      type="range"
                      min={cfg.minLength}
                      max={cfg.maxLength}
                      step={1}
                      value={shownLength}
                      onChange={(e) =>
                        onWordLengthChange(Number(e.target.value))
                      }
                    />
                  )}

                  <div className="settings-row">
                    <div className="settings-label">Liczba prób</div>
                    <div className="settings-value">{shownTries}</div>
                  </div>

                  {isDaily(mode) && (
                    <div className="settings-note muted">
                      Daily: 5 cyfr, 6 prób
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
