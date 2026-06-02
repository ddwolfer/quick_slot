// QuickSlot 核心型別（玩法無關）
export type Mechanic = 'payline' | 'ways' | 'cluster';
export type SymbolKind = 'high' | 'low' | 'wild' | 'scatter';

export interface SymbolDef {
  id: string;
  kind: SymbolKind;
  /** count(字串) -> 倍數（以 base bet 為單位） */
  pay?: Record<string, number>;
  /** placeholder 顏色，例如 "#4d7cff"；有美術後可省略 */
  color?: string;
  /** 顯示文字，預設用 id */
  label?: string;
}

export interface GameConfig {
  theme: string;
  mechanic: Mechanic;
  grid: { reels: number; rows: number };
  paylines?: number;
  bet: { default: number; levels: number[] };
  rtpTarget: number;
  symbols: SymbolDef[];
  /** 每軸符號帶 reelStrips[reel] = string[] */
  reelStrips: string[][];
  freeSpins?: { trigger: number; count: number };
}

/** board[reel][row] */
export type Board = string[][];

export type WinEvent = {
  type: 'win';
  line: number;
  positions: [number, number][];
  symbolId: string;
  count: number;
  amount: number;
};

export type ScatterWinEvent = {
  type: 'scatterWin';
  positions: [number, number][];
  symbolId: string;
  count: number;
  amount: number;
};

export type GameEvent =
  | { type: 'reveal'; board: Board }
  | WinEvent
  | ScatterWinEvent
  | { type: 'totalWin'; amount: number };

export interface SpinResult {
  board: Board;
  events: GameEvent[];
  totalWin: number;
}

export type Evaluator = (
  board: Board,
  cfg: GameConfig,
  totalBet: number
) => { events: GameEvent[]; totalWin: number };
