import { Container, Graphics, Text, TextStyle, type Ticker } from 'pixi.js';
import type { GameConfig, WinEvent, ScatterWinEvent } from '../core/types';

export class WinPresenter {
  overlay = new Container(); // 中獎線 / 高亮（與 reels 同座標）
  private cellSize: number;
  private ticker: Ticker;
  private winText: Text;

  constructor(_cfg: GameConfig, cellSize: number, ticker: Ticker) {
    this.cellSize = cellSize;
    this.ticker = ticker;
    this.winText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 72,
        fontWeight: '900',
        fill: 0xffe14d,
        stroke: { color: 0x3a2a00, width: 7 },
      }),
    });
    this.winText.anchor.set(0.5);
    this.winText.visible = false;
  }

  getWinText(): Text {
    return this.winText;
  }

  private center(reel: number, row: number) {
    return { x: reel * this.cellSize + this.cellSize / 2, y: row * this.cellSize + this.cellSize / 2 };
  }

  private pulse(g: Graphics, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;
      const fn = (tk: Ticker) => {
        elapsed += tk.deltaMS;
        const p = Math.min(1, elapsed / durationMs);
        g.alpha = 0.35 + 0.65 * Math.abs(Math.sin(p * Math.PI * 2));
        if (p >= 1) {
          this.ticker.remove(fn);
          resolve();
        }
      };
      this.ticker.add(fn);
    });
  }

  async showWin(e: WinEvent): Promise<void> {
    const g = new Graphics();
    // 中獎格高亮邊框
    for (const [reel, row] of e.positions) {
      const x = reel * this.cellSize;
      const y = row * this.cellSize;
      g.roundRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8, 12).stroke({
        width: 5,
        color: 0xffe14d,
      });
    }
    // 連線
    const pts = e.positions.map(([reel, row]) => this.center(reel, row));
    if (pts.length > 1) {
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.stroke({ width: 5, color: 0xffe14d, alpha: 0.9 });
    }
    this.overlay.addChild(g);
    await this.pulse(g, 480);
    this.overlay.removeChild(g);
    g.destroy();
  }

  async showScatter(e: ScatterWinEvent): Promise<void> {
    const g = new Graphics();
    for (const [reel, row] of e.positions) {
      const x = reel * this.cellSize;
      const y = row * this.cellSize;
      g.roundRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8, 12).stroke({
        width: 6,
        color: 0xff4d8d,
      });
    }
    this.overlay.addChild(g);
    await this.pulse(g, 600);
    this.overlay.removeChild(g);
    g.destroy();
  }

  async showTotal(amount: number): Promise<void> {
    if (amount <= 0) return;
    this.winText.visible = true;
    let elapsed = 0;
    const dur = 850;
    await new Promise<void>((resolve) => {
      const fn = (tk: Ticker) => {
        elapsed += tk.deltaMS;
        const p = Math.min(1, elapsed / dur);
        this.winText.text = (amount * p).toFixed(2);
        const sc = 0.8 + 0.3 * p;
        this.winText.scale.set(sc);
        if (p >= 1) {
          this.ticker.remove(fn);
          resolve();
        }
      };
      this.ticker.add(fn);
    });
    this.winText.text = amount.toFixed(2);
    await new Promise((r) => setTimeout(r, 650));
    this.winText.visible = false;
    this.winText.scale.set(1);
  }
}
