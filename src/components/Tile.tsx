import type { Tile } from "../game/types";
import "./board.css";

type Props = {
  tile: Tile;
};

export function Tile({ tile }: Props) {
  const text = tile.letter.toUpperCase();

  return (
    <div className={`tile tile--${tile.status}`} aria-label={text || "empty"}>
      {text}
    </div>
  );
}