import { useEffect, useMemo, useState } from "react";

import { Board } from "./components/Board";
import type { RowActor } from "./components/Board";
import { Keyboard } from "./components/Keyboard";
import { Menu } from "./components/Menu";
import { ResultModal } from "./components/ResultModal";
import { RulesModal } from "./components/RulesModal";
import { StatsModal } from "./components/StatsModal";

import type { GameMode } from "./game/modes";
import type { FeedbackStatus, KeyStatus, Tile, TileStatus } from "./game/types";
import type { NumberleStats } from "./game/stats";

import { getFeedback } from "./game/feedback";
import { generateDailySecret } from "./game/daily";
import { buildHardConstraints, validateHardGuess } from "./game/hardMode";
import {
  getMastermindFeedback,
  type MastermindFeedback,
} from "./game/mastermind";
import {
  allowsRepeats,
  clampLength,
  getDefaultLength,
  getTries,
  isDaily,
  isMastermind,
  MODE_CONFIG,
} from "./game/modes";
import {
  generateSecretCode,
  generateSecretCodeNoRepeats,
} from "./game/secretCode";
import {
  hasCompletedDailyToday,
  loadStats,
  recordCompletedGame,
  saveStats,
} from "./game/stats";
import { hasNoRepeats } from "./game/validators";
import { getBotGuess, type BotLevel, type BotMoveInfo } from "./game/bot";

import "./app.css";

// Pomocnicze funkcje

function emptyRow(len: number): Tile[] {
  return Array.from({ length: len }, () => ({ letter: "", status: "empty" }));
}

function rowFromString(
  str: string,
  len: number,
  feedback?: FeedbackStatus[],
): Tile[] {
  const chars = str.slice(0, len).split("");

  return Array.from({ length: len }, (_, i) => {
    const letter = chars[i] ?? "";
    const status: TileStatus = feedback?.[i] ?? (letter ? "filled" : "empty");

    return { letter, status };
  });
}

function makeSecret(mode: GameMode, len: number) {
  const L = clampLength(mode, len);

  if (isDaily(mode)) {
    return generateDailySecret({
      modeId: mode,
      length: L,
      noRepeats: !allowsRepeats(mode),
    });
  }

  if (!allowsRepeats(mode)) return generateSecretCodeNoRepeats(L);
  return generateSecretCode(L);
}

function mergeKeyStatus(
  prev: Record<string, KeyStatus>,
  guess: string,
  fb: FeedbackStatus[],
): Record<string, KeyStatus> {
  const next = { ...prev };

  fb.forEach((tileStatus, i) => {
    const key = guess[i];
    const existing = next[key];

    if (existing === "correct") return;

    if (tileStatus === "correct") {
      next[key] = "correct";
      return;
    }

    if (tileStatus === "present") {
      if (existing === "empty" || !existing) next[key] = "present";
      return;
    }

    if (!existing) next[key] = "absent";
  });

  return next;
}

export default function App() {
  // Stan gry

  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackStatus[][]>([]);
  const [mmFeedbacks, setMmFeedbacks] = useState<MastermindFeedback[]>([]);

  const [rowActors, setRowActors] = useState<Array<RowActor | undefined>>([]);
  const [botLevel, setBotLevel] = useState<BotLevel>("off");
  const [lostByBot, setLostByBot] = useState(false);

  const [rowIndex, setRowIndex] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [keyStatus, setKeyStatus] = useState<Record<string, KeyStatus>>({});

  // Stan UI

  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Statystyki

  const [statsSaved, setStatsSaved] = useState(false);
  const [stats, setStats] = useState<NumberleStats>(() => loadStats());

  // Ustawienia gry

  const [mode, setMode] = useState<GameMode>("classic");

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("numberleTheme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  const [wordLength, setWordLength] = useState(() =>
    getDefaultLength("classic"),
  );

  const [maxTries, setMaxTries] = useState(() =>
    getTries("classic", getDefaultLength("classic")),
  );

  const [secret, setSecret] = useState(() =>
    makeSecret("classic", getDefaultLength("classic")),
  );

  // Dane pochodne

  const isBotGame = mode === "classic" && botLevel !== "off";
  const totalRows = isBotGame ? maxTries * 2 : maxTries;
  const dailyCompleted = mode === "daily" && hasCompletedDailyToday(stats);
  const compact = totalRows >= 8;

  function showDailyCompletedHint() {
    setHint("Dzisiejsze Daily jest już ukończone. Wróć jutro.");
  }

  // Plansza

  const rows: Tile[][] = useMemo(() => {
    const out: Tile[][] = [];

    for (let r = 0; r < totalRows; r++) {
      if (guesses[r] !== undefined) {
        out.push(rowFromString(guesses[r], wordLength, feedbacks[r]));
      } else if (r === rowIndex && status === "playing") {
        out.push(rowFromString(currentGuess, wordLength));
      } else {
        out.push(emptyRow(wordLength));
      }
    }

    return out;
  }, [
    currentGuess,
    guesses,
    feedbacks,
    rowIndex,
    totalRows,
    wordLength,
    status,
  ]);

  const visibleRowActors = useMemo(() => {
    const out: Array<RowActor | undefined> = Array.from(
      { length: totalRows },
      (_, i) => rowActors[i],
    );

    if (isBotGame && status === "playing" && rowIndex < totalRows) {
      out[rowIndex] = "player";
    }

    return out;
  }, [isBotGame, rowActors, rowIndex, status, totalRows]);

  // Reset gry

  function restart() {
    setCurrentGuess("");
    setGuesses([]);
    setFeedbacks([]);
    setMmFeedbacks([]);
    setRowActors([]);
    setRowIndex(0);
    setStatus("playing");
    setKeyStatus({});
    setHint(null);
    setLostByBot(false);
    setStatsSaved(false);
    setResultOpen(false);
  }

  // Zmiana trybu

  function applyMode(nextMode: GameMode) {
    const L = clampLength(nextMode, getDefaultLength(nextMode));
    const T = getTries(nextMode, L);

    setMode(nextMode);

    if (nextMode !== "classic") {
      setBotLevel("off");
    }

    setWordLength(L);
    setMaxTries(T);
    setSecret(makeSecret(nextMode, L));
    restart();

    if (nextMode === "daily" && hasCompletedDailyToday(stats)) {
      setHint("Dzisiejsze Daily jest już ukończone. Wróć jutro.");
    }
  }

  function applyLength(nextLen: number) {
    const cfg = MODE_CONFIG[mode];
    if (cfg.lockLength) return;

    const L = clampLength(mode, nextLen);
    const T = getTries(mode, L);

    setWordLength(L);
    setMaxTries(T);
    setSecret(makeSecret(mode, L));
    restart();
  }

  function changeBotLevel(nextLevel: BotLevel) {
    const L = clampLength("classic", wordLength);
    const T = getTries("classic", L);

    setBotLevel(nextLevel);
    setMode("classic");
    setWordLength(L);
    setMaxTries(T);
    setSecret(makeSecret("classic", L));
    restart();
  }

  // Nowa gra

  function newGame() {
    if (isDaily(mode)) {
      if (hasCompletedDailyToday(stats)) {
        showDailyCompletedHint();
        return;
      }

      restart();
      return;
    }

    setSecret(makeSecret(mode, wordLength));
    restart();
  }

  // Wejście gracza

  function typeNumber(n: string) {
    if (status !== "playing") return;
    if (rowIndex >= totalRows) return;
    if (!/^\d$/.test(n)) return;

    if (dailyCompleted) {
      showDailyCompletedHint();
      return;
    }

    setHint(null);
    setCurrentGuess((prev) => (prev.length >= wordLength ? prev : prev + n));
  }

  function backspace() {
    if (status !== "playing") return;

    if (dailyCompleted) {
      showDailyCompletedHint();
      return;
    }

    setHint(null);
    setCurrentGuess((prev) => prev.slice(0, -1));
  }

  // Ruch bota

  function submitBotClassic() {
    const playerGuess = currentGuess;
    const playerFeedback = getFeedback(playerGuess, secret);
    const playerRow = rowIndex;

    const nextGuesses = [...guesses];
    const nextFeedbacks = [...feedbacks];
    const nextActors = [...rowActors];

    nextGuesses[playerRow] = playerGuess;
    nextFeedbacks[playerRow] = playerFeedback;
    nextActors[playerRow] = "player";

    let nextKeyStatus = mergeKeyStatus(keyStatus, playerGuess, playerFeedback);

    if (playerGuess === secret) {
      setGuesses(nextGuesses);
      setFeedbacks(nextFeedbacks);
      setRowActors(nextActors);
      setKeyStatus(nextKeyStatus);
      setStatus("won");
      setLostByBot(false);
      setRowIndex(playerRow + 1);
      setCurrentGuess("");
      return;
    }

    const botRow = playerRow + 1;

    if (botRow >= totalRows) {
      setGuesses(nextGuesses);
      setFeedbacks(nextFeedbacks);
      setRowActors(nextActors);
      setKeyStatus(nextKeyStatus);
      setStatus("lost");
      setLostByBot(false);
      setRowIndex(playerRow + 1);
      setCurrentGuess("");
      return;
    }

    const publicMoves: BotMoveInfo[] = nextGuesses.flatMap((guess, i) => {
      const feedback = nextFeedbacks[i];
      if (!guess || !feedback) return [];

      return [{ guess, feedback }];
    });

    const used = new Set(nextGuesses.filter(Boolean));

    const botGuess = getBotGuess({
      level: botLevel,
      length: wordLength,
      moves: publicMoves,
      used,
    });

    const botFeedback = getFeedback(botGuess, secret);

    nextGuesses[botRow] = botGuess;
    nextFeedbacks[botRow] = botFeedback;
    nextActors[botRow] = "bot";

    nextKeyStatus = mergeKeyStatus(nextKeyStatus, botGuess, botFeedback);

    setGuesses(nextGuesses);
    setFeedbacks(nextFeedbacks);
    setRowActors(nextActors);
    setKeyStatus(nextKeyStatus);

    if (botGuess === secret) {
      setStatus("lost");
      setLostByBot(true);
      setRowIndex(botRow + 1);
      setCurrentGuess("");
      return;
    }

    if (botRow === totalRows - 1) {
      setStatus("lost");
      setLostByBot(false);
      setRowIndex(botRow + 1);
      setCurrentGuess("");
      return;
    }

    setRowIndex(botRow + 1);
    setCurrentGuess("");
  }

  // Zatwierdzanie próby

  function submit() {
    if (status !== "playing") return;
    if (rowIndex >= totalRows) return;
    if (currentGuess.length !== wordLength) return;

    if (dailyCompleted) {
      showDailyCompletedHint();
      return;
    }

    if (isBotGame) {
      setHint(null);
      submitBotClassic();
      return;
    }

    if (mode === "noRepeats" && !hasNoRepeats(currentGuess)) {
      setHint("Tryb No Repeats: cyfry nie mogą się powtarzać.");
      return;
    }

    if (mode === "hard") {
      const constraints = buildHardConstraints(guesses, feedbacks, wordLength);
      const err = validateHardGuess(currentGuess, constraints);

      if (err) {
        setHint(err);
        return;
      }
    }

    setHint(null);

    if (isMastermind(mode)) {
      const mm = getMastermindFeedback(currentGuess, secret);

      setGuesses((prev) => {
        const next = [...prev];
        next[rowIndex] = currentGuess;
        return next;
      });

      setMmFeedbacks((prev) => {
        const next = [...prev];
        next[rowIndex] = mm;
        return next;
      });

      if (currentGuess === secret) setStatus("won");
      else if (rowIndex === maxTries - 1) setStatus("lost");

      setRowIndex((prev) => prev + 1);
      setCurrentGuess("");
      return;
    }

    const fb = getFeedback(currentGuess, secret);

    setKeyStatus((prev) => mergeKeyStatus(prev, currentGuess, fb));

    setGuesses((prev) => {
      const next = [...prev];
      next[rowIndex] = currentGuess;
      return next;
    });

    setFeedbacks((prev) => {
      const next = [...prev];
      next[rowIndex] = fb;
      return next;
    });

    if (currentGuess === secret) setStatus("won");
    else if (rowIndex === maxTries - 1) setStatus("lost");

    setRowIndex((prev) => prev + 1);
    setCurrentGuess("");
  }

  // Efekty

  useEffect(() => {
    localStorage.setItem("numberleTheme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key;
      const el = e.target as HTMLElement | null;

      if (
        el &&
        ["BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
      ) {
        return;
      }

      if (key === "Enter") {
        e.preventDefault();
        submit();
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }

      if (/^\d$/.test(key)) typeNumber(key);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    status,
    rowIndex,
    totalRows,
    wordLength,
    currentGuess,
    secret,
    mode,
    guesses,
    feedbacks,
    rowActors,
    keyStatus,
    botLevel,
    isBotGame,
  ]);

  useEffect(() => {
    if (status === "playing") return;
    if (statsSaved) return;

    setStats((prev) => {
      const next = recordCompletedGame(prev, {
        mode,
        isBotGame,
        result: status,
        lostByBot,
        completedRowIndex: rowIndex,
      });

      saveStats(next);
      return next;
    });

    setStatsSaved(true);
  }, [status, statsSaved, mode, isBotGame, lostByBot, rowIndex]);

  useEffect(() => {
    if (status === "playing") return;
    setResultOpen(true);
  }, [status]);

  // Render

  return (
    <>
      <div className={`app-shell ${compact ? "app-shell--compact" : ""}`}>
        <header className="app-header">
          <div className="top-inner">
            <button
              className="menu-open-btn"
              onClick={() => setMenuOpen(true)}
              type="button"
              aria-label="open menu"
            >
              ☰
            </button>

            <h1 className="title">Numberle</h1>

            <div className="top-placeholder" aria-hidden="true" />
          </div>

          <p className="msg" aria-live="polite">
            {status === "playing" ? hint : ""}
          </p>
        </header>

        <main className="app-main">
          <Board
            rows={rows}
            mastermindFeedbacks={isMastermind(mode) ? mmFeedbacks : []}
            showMastermindFeedback={isMastermind(mode)}
            rowActors={isBotGame ? visibleRowActors : []}
          />
        </main>

        <footer className="app-footer">
          <Keyboard
            keyStatus={keyStatus}
            onNumber={typeNumber}
            onEnter={submit}
            onBackspace={backspace}
          />
        </footer>
      </div>

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNewGame={() => {
          newGame();
          setMenuOpen(false);
        }}
        onRestart={() => {
          if (dailyCompleted) {
            showDailyCompletedHint();
            setMenuOpen(false);
            return;
          }

          restart();
          setMenuOpen(false);
        }}
        onOpenRules={() => {
          setRulesOpen(true);
          setMenuOpen(false);
        }}
        onOpenStats={() => {
          setStatsOpen(true);
          setMenuOpen(false);
        }}
        mode={mode}
        onModeChange={(m) => applyMode(m)}
        wordLength={wordLength}
        onWordLengthChange={(n) => applyLength(n)}
        maxTries={maxTries}
        theme={theme}
        onThemeChange={setTheme}
        botLevel={botLevel}
        onBotLevelChange={changeBotLevel}
      />

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
      />

      <ResultModal
        open={resultOpen && status !== "playing"}
        status={status === "won" ? "won" : "lost"}
        secret={secret}
        mode={mode}
        isBotGame={isBotGame}
        lostByBot={lostByBot}
        rowIndex={rowIndex}
        maxTries={maxTries}
        stats={stats}
        onClose={() => setResultOpen(false)}
        onNewGame={() => {
          newGame();
          setResultOpen(false);
        }}
        onOpenStats={() => {
          setResultOpen(false);
          setStatsOpen(true);
        }}
      />
    </>
  );
}
