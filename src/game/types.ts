export type TileStatus =
  | "empty"
  | "filled"
  | "correct"
  | "present"
  | "absent";

export type FeedbackStatus =
  | "correct"
  | "present"
  | "absent";

export type KeyStatus =
  | "empty"
  | "absent"
  | "present"
  | "correct";

export type Tile = {
  letter: string;
  status: TileStatus;
};