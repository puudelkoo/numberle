import { useEffect, useState } from "react";

import type { KeyStatus } from "../game/types";

import "./keyboard.css";

type Props = {
  keyStatus: Record<string, KeyStatus>;
  onNumber: (number: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
};

const DESKTOP_ROWS = ["123456789", "0"];
const MOBILE_ROWS = ["12345", "67890"];

export function Keyboard({
  keyStatus,
  onNumber,
  onEnter,
  onBackspace,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  // Widok mobilny

  useEffect(() => {
    const query = window.matchMedia("(max-width: 520px)");

    function updateIsMobile() {
      setIsMobile(query.matches);
    }

    updateIsMobile();

    query.addEventListener("change", updateIsMobile);
    return () => query.removeEventListener("change", updateIsMobile);
  }, []);

  const rows = isMobile ? MOBILE_ROWS : DESKTOP_ROWS;

  function renderNumberKey(number: string) {
    const status: KeyStatus = keyStatus[number] ?? "empty";

    return (
      <button
        key={number}
        className={`key key--${status}`}
        onClick={() => onNumber(number)}
        type="button"
      >
        {number}
      </button>
    );
  }

  // Mobile

  if (isMobile) {
    return (
      <div className="keyboard keyboard--mobile" aria-label="keyboard">
        {rows.map((row) => (
          <div key={row} className="keyboard-row">
            {row.split("").map(renderNumberKey)}
          </div>
        ))}

        <div className="keyboard-row keyboard-actions">
          <button
            className="key special submit"
            onClick={onEnter}
            type="button"
          >
            SUBMIT
          </button>

          <button
            className="key special delete"
            onClick={onBackspace}
            type="button"
          >
            DELETE
          </button>
        </div>
      </div>
    );
  }

  // Desktop

  return (
    <div className="keyboard keyboard--desktop" aria-label="keyboard">
      {rows.map((row, rowIndex) => (
        <div key={row} className="keyboard-row">
          {rowIndex === rows.length - 1 && (
            <button
              className="key special submit"
              onClick={onEnter}
              type="button"
            >
              SUBMIT
            </button>
          )}

          {row.split("").map(renderNumberKey)}

          {rowIndex === rows.length - 1 && (
            <button
              className="key special delete"
              onClick={onBackspace}
              type="button"
            >
              DELETE
            </button>
          )}
        </div>
      ))}
    </div>
  );
}