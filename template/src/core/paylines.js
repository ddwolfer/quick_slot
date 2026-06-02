// 中獎線定義。row 索引由上到下 0..rows-1。

/** 5 軸 3 列的 25 條標準線 */
export const PAYLINES_5x3 = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [0, 2, 2, 2, 0],
  [2, 0, 0, 0, 2],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [1, 0, 2, 0, 1],
  [1, 2, 0, 2, 1],
];

/**
 * 取得此遊戲使用的中獎線（依 grid 與 paylines 數量）
 * @param {import('./types').GameConfig} cfg
 * @returns {number[][]}
 */
export function getLines(cfg) {
  const { reels, rows } = cfg.grid;
  const want = cfg.paylines ?? rows;
  let pool;
  if (reels === 5 && rows === 3) {
    pool = PAYLINES_5x3;
  } else {
    // 一般情況：每一列一條直線
    pool = [];
    for (let row = 0; row < rows; row++) pool.push(new Array(reels).fill(row));
  }
  return pool.slice(0, Math.min(want, pool.length));
}
