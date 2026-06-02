# QuickSlot 模板

輕量、config 驅動的本地 PixiJS 8 slot 試玩。換遊戲主要只改 `game.config.json` + `public/assets/`。

## 跑起來

```bash
npm install
npm run dev        # http://localhost:5173
```

按 `SPIN` 或空白鍵轉動。目前符號是 placeholder 色塊，接美術後替換。

## 結構

- `game.config.json` — 玩法、格子、符號、賠付、轉軸帶。
- `src/core/` — 玩法無關核心（純 JS，前端與 sim 共用）：`rng` / `engine` / `evaluators`。
- `src/render/` — PixiJS 呈現：`Reels`（轉軸）、`WinPresenter`（中獎）、`eventPlayer`。
- `src/ui/` — HTML 控制列與賠付表。
- `../tools/` — `sim.mjs`（估 RTP）、`make-strips.mjs`（產轉軸帶）、`gen-art.md`（美術 prompt 範本）。

## 換主題流程

1. 改 `game.config.json` 的 `theme` / `symbols`（含 `label`、`pay`）。
2. `node ../tools/make-strips.mjs` 產轉軸帶 → `node ../tools/sim.mjs` 看 RTP，調 `make-strips.mjs` 的 `COUNTS`。
3. 用 codex 產符號圖放 `public/assets/`，把 `src/render/symbols.ts` 的色塊換成 Sprite。

## 升級玩法（M3）

在 `src/core/evaluators/` 加 `ways.js` / `cluster.js`，於 `index.js` 註冊；cluster 的 tumble 在 `eventPlayer.ts` 加 `tumble` case + 新增 `TumbleLayer`。核心與 payline 不需改動。
