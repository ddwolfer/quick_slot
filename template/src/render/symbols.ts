import { Container, Graphics, Sprite, Text, TextStyle, type Texture } from 'pixi.js';
import type { GameConfig, SymbolDef } from '../core/types';

const KIND_COLORS: Record<string, number> = {
  high: 0x4d7cff,
  low: 0x5a6072,
  wild: 0xffcc33,
  scatter: 0xff4d8d,
};

/**
 * 符號貼圖登錄表。main.ts 啟動時若載到美術,呼叫 setSymbolTextures() 灌入;
 * makeSymbol 有貼圖就用 Sprite,沒有就 fallback 成 placeholder 色塊。
 * 用 module-level 單例,讓 reels / TumbleLayer 等所有 makeSymbol 呼叫點不必改簽章。
 */
let SYMBOL_TEXTURES: Map<string, Texture> = new Map();

export function setSymbolTextures(textures: Map<string, Texture>): void {
  SYMBOL_TEXTURES = textures;
}

export function symbolMap(cfg: GameConfig): Map<string, SymbolDef> {
  const m = new Map<string, SymbolDef>();
  for (const s of cfg.symbols) m.set(s.id, s);
  return m;
}

function parseColor(s: string | undefined, fallback: number): number {
  if (s && s.startsWith('#')) return parseInt(s.slice(1), 16);
  return fallback;
}

/**
 * 符號顯示物件。有貼圖(setSymbolTextures 灌入過)就用 Sprite,
 * 否則 fallback 成圓角色塊 + 文字標籤(M2 美術前的 placeholder)。
 */
export function makeSymbol(def: SymbolDef | undefined, id: string, size: number): Container {
  const c = new Container();
  const pad = 8;

  const tex = SYMBOL_TEXTURES.get(id);
  if (tex) {
    const sp = new Sprite(tex);
    const inner = size - pad * 2;
    const k = Math.min(inner / tex.width, inner / tex.height);
    sp.width = tex.width * k;
    sp.height = tex.height * k;
    sp.anchor.set(0.5);
    sp.x = size / 2;
    sp.y = size / 2;
    c.addChild(sp);
    return c;
  }

  const s = size - pad * 2;
  const color = parseColor(def?.color, KIND_COLORS[def?.kind ?? 'low'] ?? 0x5a6072);

  const g = new Graphics();
  g.roundRect(pad, pad, s, s, 14).fill(color);
  g.roundRect(pad, pad, s, s, 14).stroke({ width: 3, color: 0x000000, alpha: 0.25 });
  c.addChild(g);

  const label = def?.label ?? id;
  const t = new Text({
    text: label,
    style: new TextStyle({
      fontFamily: 'Arial',
      fontSize: Math.floor(size * 0.26),
      fontWeight: '900',
      fill: 0xffffff,
      align: 'center',
    }),
  });
  t.anchor.set(0.5);
  t.x = size / 2;
  t.y = size / 2;
  c.addChild(t);

  if (def?.kind === 'wild' || def?.kind === 'scatter') {
    const tag = new Text({
      text: def.kind === 'wild' ? 'WILD' : 'SCATTER',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: Math.floor(size * 0.11),
        fontWeight: '700',
        fill: 0x1a1a1a,
      }),
    });
    tag.anchor.set(0.5, 0);
    tag.x = size / 2;
    tag.y = pad + 5;
    c.addChild(tag);
  }

  return c;
}
