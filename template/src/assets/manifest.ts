import { Assets, type Texture } from 'pixi.js';
import type { GameConfig } from '../core/types';

/**
 * 資產載入器。設計目標:**有美術才載,沒美術完全不噴 404 / console error**。
 *
 * 開關是 `public/assets/manifest.json`(gen-slot-art skill 落地美術後寫入):
 *   { "symbols": ["H1","H2",...], "background": "bg.png", "logo": "logo.png" }
 * - 沒這個檔(fetch 404,fetch 本身不丟 console error)→ 回傳空 → 全程 placeholder。
 * - 有這個檔 → 只 Assets.load 清單列出的檔,不會去 load 不存在的 → 零 404。
 */
export interface LoadedAssets {
  /** id -> Texture,只含成功載入的符號 */
  symbols: Map<string, Texture>;
  background?: Texture;
  logo?: Texture;
}

interface AssetManifest {
  symbols?: string[];
  background?: string;
  logo?: string;
}

const BASE: string = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

function assetUrl(name: string): string {
  return `${BASE}assets/${name}`.replace(/([^:]\/)\/+/g, '$1');
}

async function readManifest(): Promise<AssetManifest | null> {
  try {
    const res = await fetch(assetUrl('manifest.json'), { cache: 'no-cache' });
    if (!res.ok) return null;
    return (await res.json()) as AssetManifest;
  } catch {
    return null;
  }
}

async function tryLoad(file: string): Promise<Texture | undefined> {
  try {
    return (await Assets.load(assetUrl(file))) as Texture;
  } catch {
    return undefined;
  }
}

/**
 * 依 manifest 預載美術。無 manifest 時回傳空 LoadedAssets(placeholder 模式)。
 * @param cfg 用來在 manifest 沒列 symbols 時,以 config 符號 id 推導預設清單。
 */
export async function loadGameAssets(cfg: GameConfig): Promise<LoadedAssets> {
  const symbols = new Map<string, Texture>();
  const manifest = await readManifest();
  if (!manifest) return { symbols };

  const ids = manifest.symbols ?? cfg.symbols.map((s) => s.id);
  const tasks: Promise<void>[] = ids.map(async (id) => {
    const tex = await tryLoad(`${id}.png`);
    if (tex) symbols.set(id, tex);
  });

  const bgPromise = manifest.background ? tryLoad(manifest.background) : Promise.resolve(undefined);
  const logoPromise = manifest.logo ? tryLoad(manifest.logo) : Promise.resolve(undefined);

  const [background, logo] = await Promise.all([bgPromise, logoPromise]);
  await Promise.all(tasks);
  return { symbols, background, logo };
}
