---
name: add-mechanic
description: 新增一種玩法(ways / cluster / 自訂)——寫 evaluator 並在 evaluators/index.js 註冊;連鎖類要產 tumble events 並接 TumbleLayer。當使用者說「加一個玩法」「做 ways / cluster / megaways」「改成連鎖消除」時使用。
---

# add-mechanic

**鐵則**:核心 `engine.js` 與既有 `payline.js` 不動;玩法差異只體現在 **evaluator 產出哪些 Event**;render 用 handler map 播。`ways.js` / `cluster.js` 已內建,直接當參考。

## 步驟

1. **(若有新 Event)先加型別**:`core/types.d.ts` 的 `GameEvent` union 加新成員(細節見 `add-event` skill)。

2. **寫 evaluator**:`core/evaluators/<name>.js`,簽章 `(board, cfg, totalBet, rng?) => { events, totalWin }`。純 JS + JSDoc(`@type {import('../types').Evaluator}`),**前端與 `tools/sim.mjs` 共用同一份**。
   - 無狀態玩法參考 `ways.js`(相鄰軸計數、wild 替代)。
   - 連鎖玩法參考 `cluster.js`:用 `rng` 補新(engine 一律會把 rng 傳入),迴圈消除→下落→補新→重判,並用 guard 上限防無限迴圈。

3. **註冊**:`core/evaluators/index.js` 的 `switch` 加一個 `case`。

4. **(連鎖/新 Event)接 render**:`render/eventPlayer.ts` 加 `case`,**全程 await**;連鎖類沿用或新增 render 模組(cluster → `render/TumbleLayer.ts`)。核心與 payline 不動;新依賴用選配參數傳進 `playEvents`。

5. **config**:`game.config.json` 設 `mechanic`;cluster 另設 `minCluster` 與群 paytable。

6. **對 RTP**:切玩法後跑 `tune-rtp`(各玩法量級差很多)。

## 驗收

- `tsc --noEmit` + `vite build` 過。
- 用覆寫 `mechanic` 的 sim 量:RTP 有限、盤面恆合法(每軸列數正確)。
- 連鎖類:迴圈一定終止(guard)、tumble 連續多次不卡(await 串好)。
- **payline 500k sim RTP 不變(零回歸)**——這是「核心不動」的證明。
