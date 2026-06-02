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
  /** cluster 專用:成群最小連結數(預設 5) */
  minCluster?: number;
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

/** cluster/tumble:一次消除+補新後的盤面。removed=被消除格,board=補新後新盤面 */
export type TumbleEvent = {
  type: 'tumble';
  removed: [number, number][];
  board: Board;
};

export type GameEvent =
  | { type: 'reveal'; board: Board }
  | WinEvent
  | ScatterWinEvent
  | TumbleEvent
  | { type: 'totalWin'; amount: number };

export interface SpinResult {
  board: Board;
  events: GameEvent[];
  totalWin: number;
}

/**
 * rng 為選配:payline/ways 不需要;cluster 需要(tumble 補新要抽符號)。
 * engine.spin() 一律會把 rng 傳入,確保 cluster 補新與整體數學同源。
 */
export type Evaluator = (
  board: Board,
  cfg: GameConfig,
  totalBet: number,
  rng?: () => number
) => { events: GameEvent[]; totalWin: number };
