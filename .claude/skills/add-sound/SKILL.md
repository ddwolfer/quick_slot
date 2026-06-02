---
name: add-sound
description: 依規格書 §9.1 用 @pixi/sound 接 BGM / SFX(spin / win / reel-stop / scatter…)。當使用者說「加音效」「接 BGM」「spin / 中獎要有聲音」時使用。SoundManager scaffold 已在 render/sound.ts,接線多半只需備音檔 + 寫 manifest。
---

# add-sound

scaffold 已就緒:`render/sound.ts` 的 `SoundManager`,`main.ts` 已接 spin / reel-stop / win / BGM 與 🔊 靜音鈕。加音效 = **備音檔 + 寫 manifest**;要更細的觸發再加掛點。`@pixi/sound` 已在 `package.json`。

## 步驟

1. **備音檔**:依 §9.1 清單放 `template/public/assets/audio/*.mp3`(或 `.ogg`)。key 對齊 `SfxKey`:`bgm_base` / `bgm_freespin` / `sfx_spin` / `sfx_reel_stop` / `sfx_win_small` / `sfx_win_big` / `sfx_scatter`。

2. **寫 manifest(開關)**:`template/public/assets/audio/manifest.json`
   ```json
   {
     "sfx_spin": "spin.mp3",
     "sfx_reel_stop": "reel-stop.mp3",
     "sfx_win_small": "win.mp3",
     "sfx_win_big": "bigwin.mp3",
     "bgm_base": "bgm.mp3"
   }
   ```
   無 manifest = 全程靜音(`play` no-op),不報錯。只註冊清單列出的 key。

3. **既有掛點(免改碼)**:spin → `sfx_spin`;每軸停 → `sfx_reel_stop`(`Reels` 的 `onReelStop` callback);贏額分級 → `sfx_win_big`(≥ 20× bet)/ `sfx_win_small`;首次互動 → `bgm_base` loop;🔊 鈕切靜音。

4. **加新掛點(要更細時)**:例如 scatter 落定播 `sfx_scatter`——把 `soundMgr` 以**選配參數**傳進 `playEvents`,在 `scatterWin` case 呼叫 `soundMgr.play('sfx_scatter')`(模式同 `tumbleLayer?`,見 `add-event` skill)。

## 驗收

- 有音檔出聲、無音檔靜音且**不報任何 console error**。
- BGM loop;🔊 靜音鈕有效。
- 連續快速點 SPIN 音效不爆音 / 不堆疊。
- `npx tsc --noEmit` + `npx vite build` 過。
