import type { Ticker } from 'pixi.js';

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type EaseFn = (t: number) => number;

export const easeOutCubic: EaseFn = (t) => 1 - Math.pow(1 - t, 3);

export const easeOutBack: EaseFn = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * 用 PixiJS ticker 驅動的 tween。回傳 Promise，動畫結束才 resolve。
 * 所有動畫一律 await，避免 race / 卡住（借 StakeProject 教訓）。
 */
export function tween(
  ticker: Ticker,
  durationMs: number,
  onUpdate: (t: number) => void,
  ease: EaseFn = easeOutCubic
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const fn = (tk: Ticker) => {
      elapsed += tk.deltaMS;
      const p = Math.min(1, elapsed / durationMs);
      onUpdate(ease(p));
      if (p >= 1) {
        ticker.remove(fn);
        resolve();
      }
    };
    ticker.add(fn);
  });
}
