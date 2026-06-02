# QuickSlot 模板

輕量、config 驅動的本地 PixiJS 8 slot 試玩。換遊戲主要只改 `game.config.json` + `public/assets/`。

## 跑起來

```bash
npm install
npm run dev        # http://localhost:5173
```

按 `SPIN` 或空白鍵轉動。符號預設是 placeholder 色塊;丟美術即自動換成圖(見下)。

## 結構

- `game.config.json` — 玩法、格子、符號、賠付、轉軸帶(`mechanic`: `payline` | `ways` | `cluster`)。
- `src/core/` — 玩法無關核心(純 JS,前端與 `tools/sim.mjs` 共用):`rng` / `engine` / `paylines` / `evaluators/{payline,ways,cluster}`。
- `src/render/` — PixiJS 呈現:`reels`(轉軸+tumble 下落補新)、`winPresenter`(高亮/連線/countup)、`TumbleLayer`(可插拔 cluster 爆破)、`sound`(SoundManager)、`eventPlayer`(逐事件 await)。
- `src/assets/manifest.ts` — 美術載入器(manifest 驅動)。
- `src/ui/` — HTML 控制列與賠付表;`index.html` 另有靜音鈕。
- `../tools/` — `sim.mjs`(估 RTP)、`make-strips.mjs`(產轉軸帶)、`gen-art.md`(美術 prompt 範本)。

## 換主題流程

1. 改 `game.config.json` 的 `theme` / `symbols`(含 `label`、`pay`)。
2. `node ../tools/make-strips.mjs` 產轉軸帶 → `node ../tools/sim.mjs` 看 RTP,調 `make-strips.mjs` 的 `COUNTS`(或用 `tune-rtp` skill)。
3. 美術:把 PNG 丟 `public/assets/`(`H1.png`…`S.png`、`bg.png`、`logo.png`),再寫 `public/assets/manifest.json`:
   ```json
   { "symbols": ["H1","H2","H3","H4","L1","L2","L3","L4","W","S"], "background": "bg.png", "logo": "logo.png" }
   ```
   有 manifest 自動以 `Sprite` 取代色塊;沒有就維持 placeholder(零 404)。**程式碼不必改**。

## 音效(選配)

把音檔丟 `public/assets/audio/`,寫 `public/assets/audio/manifest.json`(key 見 `src/render/sound.ts` 的 `SfxKey`):

```json
{ "sfx_spin": "spin.mp3", "sfx_reel_stop": "reel-stop.mp3", "sfx_win_small": "win.mp3", "bgm_base": "bgm.mp3" }
```

spin / reel-stop / win / BGM 掛點已接好;無 manifest 則全程靜音、不報錯。詳見 `add-sound` skill。

## 切玩法(payline / ways / cluster)

改 `game.config.json` 的 `mechanic` 即可:

- `payline` — 左到右連線(預設,RTP 已對到 ~94%)。
- `ways` — 相鄰軸 ways 計數。
- `cluster` — 正交成群 + tumble 連鎖消除(另設 `minCluster`)。

ways / cluster 切換後**務必用 `tune-rtp` skill 重新對 RTP**(量級與 payline 不同)。新增自訂玩法見 `add-mechanic` skill;核心與 payline 不需改動。
