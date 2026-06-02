// 可 seed 的亂數（mulberry32）。前端與 sim 共用。

/**
 * @param {number} [seed]
 * @returns {() => number} 回傳 [0,1) 的亂數函式
 */
export function makeRng(seed) {
  let s = (seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {() => number} rng
 * @param {number} n
 * @returns {number} [0,n)
 */
export function randInt(rng, n) {
  return Math.floor(rng() * n);
}
