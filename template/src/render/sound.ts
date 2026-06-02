import { sound } from '@pixi/sound';

/**
 * 音效管理(對齊 規格書 §9.1)。設計目標同美術:**有音檔才出聲,沒音檔全程靜音、零 console error**。
 *
 * 開關是 `public/assets/audio/manifest.json`(使用者備齊音檔後寫入):
 *   { "sfx_spin": "spin.mp3", "sfx_reel_stop": "reel-stop.mp3", "bgm_base": "bgm.mp3", ... }
 * - 沒這個檔 → 不註冊任何音、play() 全 no-op。
 * - 有 → 只註冊清單列出的 key;play 未註冊的 key 也安全 no-op。
 *
 * 接線範例見 add-sound skill 與 main.ts;reel-stop 透過 Reels 的 onReelStop callback 解耦觸發。
 */
export type SfxKey =
  | 'bgm_base'
  | 'bgm_freespin'
  | 'sfx_spin'
  | 'sfx_reel_stop'
  | 'sfx_win_small'
  | 'sfx_win_big'
  | 'sfx_scatter';

type AudioManifest = Partial<Record<SfxKey, string>>;

const BASE: string = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

function audioUrl(file: string): string {
  return `${BASE}assets/audio/${file}`.replace(/([^:]\/)\/+/g, '$1');
}

export class SoundManager {
  private registered = new Set<SfxKey>();
  private muted = false;
  private bgmKey: SfxKey | null = null;

  /** 讀 audio manifest 並註冊音效。無 manifest → 靜音模式(全 no-op)。 */
  async load(): Promise<void> {
    let manifest: AudioManifest | null = null;
    try {
      const res = await fetch(audioUrl('manifest.json'), { cache: 'no-cache' });
      if (res.ok) manifest = (await res.json()) as AudioManifest;
    } catch {
      manifest = null;
    }
    if (!manifest) return;

    for (const [key, file] of Object.entries(manifest)) {
      if (!file) continue;
      try {
        sound.add(key, { url: audioUrl(file), preload: true });
        this.registered.add(key as SfxKey);
      } catch {
        /* 單一音檔失敗不影響其他 */
      }
    }
  }

  play(key: SfxKey, opts?: { loop?: boolean; volume?: number }): void {
    if (this.muted || !this.registered.has(key)) return;
    try {
      sound.play(key, opts);
    } catch {
      /* no-op */
    }
  }

  /** 開始 BGM(loop)。無音檔則 no-op。 */
  startBgm(key: SfxKey = 'bgm_base', volume = 0.5): void {
    if (!this.registered.has(key)) return;
    if (this.bgmKey === key) return;
    this.stopBgm();
    this.bgmKey = key;
    this.play(key, { loop: true, volume });
  }

  stopBgm(): void {
    if (this.bgmKey && this.registered.has(this.bgmKey)) {
      try {
        sound.stop(this.bgmKey);
      } catch {
        /* no-op */
      }
    }
    this.bgmKey = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      if (this.muted) sound.muteAll();
      else sound.unmuteAll();
    } catch {
      /* no-op */
    }
    return this.muted;
  }
}
