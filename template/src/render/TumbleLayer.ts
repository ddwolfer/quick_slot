import { Container, Graphics, type Ticker } from 'pixi.js';
import type { TumbleEvent } from '../core/types';
import type { Reels } from './reels';
import { tween, easeOutCubic } from './tween';

/**
 * ★ 可插拔的 cluster/tumble 呈現層。
 * payline / ways 模式根本不發 'tumble' event,所以這層完全 dormant——這就是「可插拔」。
 *
 * play() 流程(全程 await,不 fire-and-forget,避免連鎖卡 round):
 *   1) burst:在被消除格播一次擴散淡出閃光(爆破感)。
 *   2) reels.tumble():實際移除中獎格、存活下落、頂端補新到新盤面。
 *
 * overlay 與 reels 同座標(由 main.ts 設定 x/y);burst 畫在 overlay 上。
 */
export class TumbleLayer {
  overlay = new Container();
  private cellSize: number;
  private ticker: Ticker;

  constructor(cellSize: number, ticker: Ticker) {
    this.cellSize = cellSize;
    this.ticker = ticker;
  }

  async play(e: TumbleEvent, reels: Reels): Promise<void> {
    await this.burst(e.removed);
    await reels.tumble(e.removed, e.board, this.ticker);
  }

  private burst(positions: [number, number][]): Promise<void> {
    if (positions.length === 0) return Promise.resolve();
    const g = new Graphics();
    this.overlay.addChild(g);
    const cs = this.cellSize;
    return tween(
      this.ticker,
      240,
      (t) => {
        g.clear();
        const grow = 0.2 + t * 0.9; // 0.2 → 1.1 倍格寬
        const alpha = 1 - t;
        for (const [reel, row] of positions) {
          const cx = reel * cs + cs / 2;
          const cy = row * cs + cs / 2;
          const r = (cs / 2) * grow;
          g.circle(cx, cy, r).fill({ color: 0xffffff, alpha: alpha * 0.85 });
          g.circle(cx, cy, r).stroke({ width: 4, color: 0xffe14d, alpha });
        }
      },
      easeOutCubic
    ).then(() => {
      this.overlay.removeChild(g);
      g.destroy();
    });
  }
}
