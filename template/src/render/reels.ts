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

  async spinTo(final: string[], ticker: Ticker, delayMs: number, durationMs: number) {
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
  }
}

export class Reels {
  container = new Container();
  private reels: ReelView[] = [];

  constructor(cfg: GameConfig, cellSize: number, initial: Board) {
    for (let r = 0; r < cfg.grid.reels; r++) {
      const rv = new ReelView(cfg, cellSize, initial[r]);
      rv.view.x = r * cellSize;
      this.reels.push(rv);
      this.container.addChild(rv.view);
    }
  }

  /** 全部轉軸到指定盤面，左到右錯位停止；全部停妥才 resolve */
  async spin(ticker: Ticker, board: Board) {
    const tasks = this.reels.map((rv, i) => rv.spinTo(board[i], ticker, i * 120, 650 + i * 70));
    await Promise.all(tasks);
  }

  cellAt(reel: number, row: number): Container | undefined {
    return this.reels[reel]?.cellAt(row);
  }
}
