// spin 編排器：抽 board → 評分 → 產出 Event 串流。玩法無關。
import { randInt } from './rng.js';
import { getEvaluator } from './evaluators/index.js';

/**
 * 依 reelStrips 隨機抽出一個盤面。
 * @param {import('./types').GameConfig} cfg
 * @param {() => number} rng
 * @returns {import('./types').Board}
 */
export function drawBoard(cfg, rng) {
  const { reels, rows } = cfg.grid;
  /** @type {import('./types').Board} */
  const board = [];
  for (let r = 0; r < reels; r++) {
    const strip = cfg.reelStrips[r] ?? cfg.reelStrips[0];
    const stop = randInt(rng, strip.length);
    const col = [];
    for (let row = 0; row < rows; row++) col.push(strip[(stop + row) % strip.length]);
    board.push(col);
  }
  return board;
}

/**
 * 跑一次 spin。
 * @param {import('./types').GameConfig} cfg
 * @param {() => number} rng
 * @param {number} [bet] 預設用 cfg.bet.default
 * @returns {import('./types').SpinResult}
 */
export function spin(cfg, rng, bet) {
  const totalBet = bet ?? cfg.bet.default;
  const board = drawBoard(cfg, rng);
  const evaluate = getEvaluator(cfg.mechanic);
  // rng 一併傳入:payline/ways 會忽略,cluster 用它做 tumble 補新(數學同源)。
  const { events, totalWin } = evaluate(board, cfg, totalBet, rng);
  return {
    board,
    totalWin,
    events: [{ type: 'reveal', board }, ...events, { type: 'totalWin', amount: totalWin }],
  };
}
