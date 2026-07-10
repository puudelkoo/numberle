import { useEffect } from "react";

import "./rulesModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

type RuleExample = {
  digit: string;
  status: "correct" | "present" | "absent";
  title: string;
  desc: string;
};

type RuleItem = {
  title: string;
  desc: string;
};

const COLOR_EXAMPLES: RuleExample[] = [
  {
    digit: "7",
    status: "correct",
    title: "Dobre miejsce",
    desc: "Cyfra jest w kodzie i stoi na właściwej pozycji.",
  },
  {
    digit: "4",
    status: "present",
    title: "Złe miejsce",
    desc: "Cyfra jest w kodzie, ale stoi na innej pozycji.",
  },
  {
    digit: "2",
    status: "absent",
    title: "Brak cyfry",
    desc: "Tej cyfry nie ma w ukrytym kodzie.",
  },
];

const GAME_MODES: RuleItem[] = [
  {
    title: "Classic",
    desc: "podstawowy tryb z kolorowym feedbackiem.",
  },
  {
    title: "No Repeats",
    desc: "cyfry w Twoim strzale nie mogą się powtarzać.",
  },
  {
    title: "Hard",
    desc: "musisz korzystać z informacji odkrytych we wcześniejszych próbach.",
  },
  {
    title: "Daily",
    desc: "codziennie ta sama zagadka dla wszystkich.",
  },
];

const BOT_LEVELS: RuleItem[] = [
  {
    title: "Easy",
    desc: "bot gra luźniej i częściej wybiera proste strzały.",
  },
  {
    title: "Medium",
    desc: "bot analizuje feedback i wybiera zgodne możliwości.",
  },
  {
    title: "Hard",
    desc: "bot mocniej zawęża możliwe odpowiedzi.",
  },
];

// Modal zasad

export function RulesModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="rules-backdrop" onClick={onClose}>
      <section
        className="rules-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Zasady gry"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rules-header">
          <div>
            <h2 className="rules-title">Zasady gry</h2>
            <p className="rules-subtitle">Jak grać w Numberle</p>
          </div>

          <button
            className="rules-close"
            type="button"
            onClick={onClose}
            aria-label="Zamknij zasady"
          >
            ✕
          </button>
        </header>

        <div className="rules-content">
          <section className="rules-section">
            <h3>Cel gry</h3>
            <p>
              Odgadnij ukryty kod liczbowy w ograniczonej liczbie prób. Po
              każdym strzale gra pokazuje, które cyfry są poprawne.
            </p>
          </section>

          <section className="rules-section">
            <h3>Kolory kafelków</h3>

            {COLOR_EXAMPLES.map((example) => (
              <div className="rules-example" key={example.status}>
                <span className={`rules-tile rules-tile--${example.status}`}>
                  {example.digit}
                </span>

                <div>
                  <strong>{example.title}</strong>
                  <p>{example.desc}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="rules-section">
            <h3>Tryby gry</h3>

            <ul className="rules-list">
              {GAME_MODES.map((mode) => (
                <li key={mode.title}>
                  <strong>{mode.title}</strong> — {mode.desc}
                </li>
              ))}
            </ul>
          </section>

          <section className="rules-section">
            <h3>Mastermind</h3>

            <p>
              W trybie Mastermind kafelki nie dostają kolorów. Zamiast tego przy
              próbie pojawia się feedback:
            </p>

            <div className="rules-badges">
              <span>B</span>
              <p>
                <strong>Bulls</strong> — dobra cyfra na dobrym miejscu.
              </p>
            </div>

            <div className="rules-badges">
              <span>C</span>
              <p>
                <strong>Cows</strong> — dobra cyfra, ale na złym miejscu.
              </p>
            </div>
          </section>

          <section className="rules-section">
            <h3>Pojedynek z botem</h3>

            <p>
              Bot działa tylko w trybie Classic. Gracie na jednej wspólnej
              planszy, a ruchy są naprzemienne: Ty → Bot → Ty → Bot.
            </p>

            <p>
              Każdy widzi wszystkie poprzednie strzały i feedback. Wygrywa ten,
              kto pierwszy odgadnie ukryty kod.
            </p>

            <ul className="rules-list">
              {BOT_LEVELS.map((level) => (
                <li key={level.title}>
                  <strong>{level.title}</strong> — {level.desc}
                </li>
              ))}
            </ul>
          </section>

          <section className="rules-section">
            <h3>Sterowanie</h3>

            <p>
              Możesz używać klawiatury ekranowej albo fizycznej. Enter
              zatwierdza strzał, Backspace usuwa ostatnią cyfrę.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
