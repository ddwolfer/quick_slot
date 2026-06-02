---
name: add-event
description: 新增一個 Event type 與對應 render handler(對齊本框架「本地 Event 串流取代 BookEvent」)。當使用者說「加一個事件」「做 anticipation / big win / freespin 觸發動畫」「evaluator 要發新事件」時使用。
---

# add-event

本框架 `engine.spin()` 回傳 `Event[]`,`render/eventPlayer.ts` 用 handler map 逐一 **await** 播。新增一種表現 = 加一個 Event type + 一個 handler。這是把 Stake 的 BookEvent 概念在地化的最小單位。

## 步驟

1. **定型別**:`core/types.d.ts` 加
   ```ts
   export type XxxEvent = { type: 'xxx'; /* ...payload... */ };
   ```
   並把 `XxxEvent` 加進 `GameEvent` union。

2. **evaluator 產出**:在對應 evaluator 的適當位置 `events.push({ type: 'xxx', ... })`。順序即播放順序;`reveal` 在頭、`totalWin` 在尾由 `engine.spin()` 自動包,中間照 push 順序播。

3. **handler**:`render/eventPlayer.ts` 的 `switch` 加
   ```ts
   case 'xxx':
     await /* 播這個事件 */;
     break;
   ```
   **一律 await**(借 StakeProject P0 教訓:fire-and-forget 會卡 round)。

4. **呈現物件**:視需要新增 render 模組,或重用 `WinPresenter`;overlay 與 reels 同座標(`main.ts` 設 x/y)。

5. **新依賴傳遞**:若 handler 需要新物件(如 `TumbleLayer`、`SoundManager`),用 `playEvents` 的**選配參數**傳入——payline / ways 不傳也不受影響(見現有 `tumbleLayer?` 參數)。

## 驗收

- `tsc --noEmit` + `vite build` 過。
- 事件序正確、動畫順播。
- 連續快速點 SPIN 不卡、不疊圖(await 串好)。
- 既有玩法行為與 RTP 不變。
