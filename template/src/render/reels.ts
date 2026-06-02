import { Container, Graphics, type Ticker } from 'pixi.js';
import type { GameConfig, Board, SymbolDef } from '../core/types';
import { makeSymbol, symbolMap } from './symbols';
import { tween, easeOutBack, wait } from './tween';

const SCROLL_CELLS = 14; // 轉軸時捲動的隨機符號數

class ReelView {
  view = new Container(); // 定位 + 遮罩
  private strip = new Container(); // 垂直移動的符號條
  private cellH: number;
  private rows: number;
  private symMap: Map<string, SymbolDef>;
  private ids: string[];

  constructor(cfg: GameConfig, cellSize: number, initial: string[]) {
    this.cellH = cellSize;
    this.rows = cfg.grid.rows;
    this.symMap = symbolMap(cfg);
    this.ids = cfg.symbols.map((s) => s.id);

    const mask = new Graphics().rect(0, 0, cellSize, cellSize * this.rows).fill(0xffffff);
    this.view.addChild(mask);
    this.view.mask = mask;
    this.view.addChild(this.strip);
    this.renderStatic(initial);
  }

  private renderStatic(symbols: string[]) {
    this.strip.removeChildren();
    this.strip.y = 0;
    symbols.forEach((id, i) => {
      const s = makeSymbol(this.symMap.get(id), id, this.cellH);
      s.y = i * this.cellH;
      this.strip.addChild(s);
    });
  }

  /** 取得目前可見列的符號顯示物件（靜止狀態下 child index = row） */
  cellAt(row: number): Container | undefined {
    return this.strip.children[row] as Container | undefined;
  }

  private rnd(): string {
    return this.ids[Math.floor(Math.random() * this.ids.length)];
  }

  async spinTo(
    final: string[],
    ticker: Ticker,
    delayMs: number,
    durationMs: number,
    onStop?: () => void
  ) {
    if (delayMs > 0) await wait(delayMs);

    // 組 strip：[頂端 buffer][final...][隨機...]
    const cells: string[] = [];
    cells.push(this.rnd()); // index 0：頂端 buffer，避免回彈露出空白
    for (const f of final) cells.push(f); // index 1..rows
    for (let i = 0; i < SCROLL_CELLS; i++) cells.push(this.rnd());

    this.strip.removeChildren();
    cells.forEach((id, i) => {
      const s = makeSymbol(this.symMap.get(id), id, this.cellH);
      s.y = i * this.cellH;
      this.strip.addChild(s);
    });

    const yEnd = -this.cellH; // final（index 1..rows）落在可見窗
    const yStart = -SCROLL_CELLS * this.cellH; // 起始顯示高 index 的隨機符號
    this.strip.y = yStart;

    await tween(
      ticker,
      durationMs,
      (t) => {
        this.strip.y = yStart + (yEnd - yStart) * t;
      },
      easeOutBack
    );

    // 落定：重建為靜止 final（index 0..rows-1）
    this.renderStatic(final);
    onStop?.(); // 解耦掛點：每軸停下時觸發(如 reel-stop 音效)
  }

  /**
   * cluster tumble：消除 removedRows、存活下落、頂端補新到 newColumn。
   * newColumn 約定為 [新符號..., 存活符號...]（與 cluster.collapseRefill 一致）。
   */
  async tumble(removedRows: number[], newColumn: string[], ticker: Ticker, durationMs = 420) {
    // 用 Set 去重：newCount 與消除迴圈都以「唯一列」為準,避免重複列導致
    // 落列錯位或同一 Container 被 destroy 兩次（cluster 的 wild 可能重複帶入）。
    const removed = new Set(removedRows);
    const newCount = removed.size;
    if (newCount === 0) {
      this.renderStatic(newColumn);
      return;
    }

    // 目前靜止狀態：child index = row
    const current = this.strip.children.slice() as Container[];
    // 消除中獎格（已由 TumbleLayer 先播爆破，這裡直接移除）
    for (const row of removed) {
      const ch = current[row];
      if (ch) {
        this.strip.removeChild(ch);
        ch.destroy();
      }
    }

    type Anim = { c: Container; y0: number; y1: number };
    const anims: Anim[] = [];

    // 存活格（依 row 升序）落到底部 [newCount..rows-1]
    const kept: Container[] = [];
    for (let row = 0; row < this.rows; row++) {
      if (!removed.has(row) && current[row]) kept.push(current[row]);
    }
    kept.forEach((c, i) => {
      anims.push({ c, y0: c.y, y1: (newCount + i) * this.cellH });
    });

    // 新符號自頂端上方落入 [0..newCount-1]
    for (let i = 0; i < newCount; i++) {
      const id = newColumn[i];
      const c = makeSymbol(this.symMap.get(id), id, this.cellH);
      c.y = (i - newCount) * this.cellH; // 起點在可見區上方
      this.strip.addChild(c);
      anims.push({ c, y0: c.y, y1: i * this.cellH });
    }

    await tween(
      ticker,
      durationMs,
      (t) => {
        for (const a of anims) a.c.y = a.y0 + (a.y1 - a.y0) * t;
      },
      easeOutBack
    );

    this.renderStatic(newColumn);
  }
}

export class Reels {
  container = new Container();
  private reels: ReelView[] = [];
  private onReelStop?: () => void;

  constructor(cfg: GameConfig, cellSize: number, initial: Board, opts?: { onReelStop?: () => void }) {
    this.onReelStop = opts?.onReelStop;
    for (let r = 0; r < cfg.grid.reels; r++) {
      const rv = new ReelView(cfg, cellSize, initial[r]);
      rv.view.x = r * cellSize;
      this.reels.push(rv);
      this.container.addChild(rv.view);
    }
  }

  /** 全部轉軸到指定盤面，左到右錯位停止；全部停妥才 resolve */
  async spin(ticker: Ticker, board: Board) {
    const tasks = this.reels.map((rv, i) =>
      rv.spinTo(board[i], ticker, i * 120, 650 + i * 70, this.onReelStop)
    );
    await Promise.all(tasks);
  }

  /** cluster tumble：依 removed 分組到各軸,平行播消除+下落+補新;全部落定才 resolve */
  async tumble(removed: [number, number][], newBoard: Board, ticker: Ticker) {
    const byReel = new Map<number, number[]>();
    for (const [reel, row] of removed) {
      const arr = byReel.get(reel) ?? [];
      arr.push(row);
      byReel.set(reel, arr);
    }
    const tasks = this.reels.map((rv, r) => rv.tumble(byReel.get(r) ?? [], newBoard[r], ticker));
    await Promise.all(tasks);
  }

  cellAt(reel: number, row: number): Container | undefined {
    return this.reels[reel]?.cellAt(row);
  }
}
