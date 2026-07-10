import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { Tile } from "../game/types";
import { Tile as TileComp } from "./Tile";

import "./board.css";

type MastermindFeedback = {
  bulls: number;
  cows: number;
};

export type RowActor = "player" | "bot";

type Props = {
  rows: Tile[][];
  mastermindFeedbacks?: MastermindFeedback[];
  showMastermindFeedback?: boolean;
  rowActors?: Array<RowActor | undefined>;
};

// Skalowanie planszy

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getGap(width: number) {
  if (width <= 370) return 4;
  if (width <= 520) return 6;
  if (width <= 760) return 8;
  return 10;
}

function getMaxTile(width: number, rowCount: number, maxCols: number) {
  const isDenseBoard = rowCount >= 8 || maxCols >= 7;

  if (width <= 370) return isDenseBoard ? 34 : 38;
  if (width <= 520) return isDenseBoard ? 39 : 44;
  if (width <= 760) return isDenseBoard ? 48 : 54;
  if (width <= 1200) return isDenseBoard ? 56 : 64;

  return isDenseBoard ? 58 : 72;
}

function getMinTile(width: number) {
  if (width <= 370) return 22;
  if (width <= 520) return 24;
  return 28;
}

function getSideSlots(width: number) {
  return {
    actorSlot: width <= 370 ? 30 : width <= 520 ? 36 : 46,
    feedbackSlot: width <= 370 ? 32 : width <= 520 ? 42 : 56,
  };
}

export function Board({
  rows,
  mastermindFeedbacks = [],
  showMastermindFeedback = false,
  rowActors = [],
}: Props) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const maxCols = Math.max(1, ...rows.map((row) => row.length));
  const rowCount = Math.max(1, rows.length);

  const hasAnyActor = rowActors.some(Boolean);
  const hasAnyFeedback =
    showMastermindFeedback && mastermindFeedbacks.some(Boolean);

  // Pomiar kontenera

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;

      setBox({
        width: rect.width,
        height: rect.height,
      });
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Rozmiar kafelków

  const sizing = useMemo(() => {
    const width = box.width || window.innerWidth;
    const height = box.height || window.innerHeight;

    const gap = getGap(width);
    const maxTile = getMaxTile(width, rowCount, maxCols);
    const minTile = getMinTile(width);

    const { actorSlot, feedbackSlot } = getSideSlots(width);

    const sideSlot = hasAnyActor
      ? actorSlot
      : hasAnyFeedback
        ? feedbackSlot
        : 0;

    const horizontalGaps = (maxCols - 1) * gap;
    const verticalGaps = (rowCount - 1) * gap;
    const sideSpace = sideSlot * 2 + (sideSlot > 0 ? gap * 2 : 0);

    const tileByWidth = (width - sideSpace - horizontalGaps - 4) / maxCols;

    const tileByHeight = (height - verticalGaps - 4) / rowCount;

    const tileSize = Math.floor(
      clamp(Math.min(tileByWidth, tileByHeight), minTile, maxTile),
    );

    return {
      tileSize,
      gap,
      actorSlot,
      feedbackSlot,
    };
  }, [box, maxCols, rowCount, hasAnyActor, hasAnyFeedback]);

  // Render

  return (
    <div
      ref={boardRef}
      className={[
        "board",
        `board--cols-${maxCols}`,
        hasAnyActor ? "board--with-actors" : "",
        hasAnyFeedback ? "board--with-feedback" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="grid"
      aria-label="numberle board"
      style={
        {
          "--tile-size": `${sizing.tileSize}px`,
          "--gap": `${sizing.gap}px`,
          "--actor-slot": `${sizing.actorSlot}px`,
          "--feedback-slot": `${sizing.feedbackSlot}px`,
        } as CSSProperties
      }
    >
      <div className="board-inner">
        {rows.map((row, rowIndex) => {
          const feedback = mastermindFeedbacks[rowIndex];
          const hasFeedback = showMastermindFeedback && !!feedback;

          const actor = rowActors[rowIndex];
          const hasActor = !!actor;

          return (
            <div
              className={[
                "row-wrap",
                hasFeedback ? "row-wrap--with-feedback" : "",
                hasActor ? "row-wrap--with-actor" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={rowIndex}
            >
              {hasFeedback && <div className="row-spacer" aria-hidden="true" />}

              {hasActor && (
                <div className={`row-actor row-actor--${actor}`}>
                  {actor === "player" ? "TY" : "BOT"}
                </div>
              )}

              <div
                className="row"
                role="row"
                style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
              >
                {row.map((tile, tileIndex) => (
                  <div role="gridcell" key={tileIndex}>
                    <TileComp tile={tile} />
                  </div>
                ))}
              </div>

              {hasActor && (
                <div className="row-actor-spacer" aria-hidden="true" />
              )}

              {hasFeedback && (
                <div className="row-feedback-slot">
                  <div className="mm-feedback">
                    <span>B{feedback.bulls}</span>
                    <span>C{feedback.cows}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
