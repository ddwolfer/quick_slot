---
name: gen-slot-fx
description: 為 wild / scatter / big win 做 1–2 個 hero FX(脈動 / 旋轉 / 發光),優先用 Spine(pixi-spine),不行就退回 PixiJS tween / particle。當使用者說「加特效」「wild 發光」「big win 動畫」「hero FX」時使用。Spine 工具是半成品,省著用。
---

# gen-slot-fx

**原則**:只做最炫的 1–2 個 FX;Spine 卡住就退回程式化 tween,別卡在 spine。

## 路線 A — Spine(若 spineai 工具可用)

1. 用 `spineai-patterns` / `gen-spine` 產 wild 或 scatter 的 `.json + .atlas + .png`。
2. 安裝 `pixi-spine`(需與 pixi 8 相容版),Spine 檔放 `template/public/assets/spine/`。
3. 載入:`Assets.load` atlas + json → `new Spine(...)`;遵守 **T01 `pma:false`**、**T07 不設 default attachment**、**T08 set default animation**。
4. 接在符號落定 / 中獎時播,**全程 await**。

## 路線 B — 退回 PixiJS(預設安全路線,不加依賴)

1. 用 `render/tween.ts` 對中獎符號做 scale 脈動 / alpha 發光 / 旋轉。
2. 或用 `Graphics` 畫粒子爆破——直接參考 `render/TumbleLayer.ts` 的 `burst()`(擴散圓 + 淡出)。
3. 包成一個 render 模組,在 `eventPlayer.ts` 對應 event(如 `win` / `scatterWin` / 自訂 `bigWin`)播放。新 event 走 `add-event` skill。

## 驗收

- FX 能播且 await 不卡 round。
- Spine 路線:`pixi-spine` 載入不報錯、動畫能播,三條 T 規則遵守。
- 退回路線:不需新依賴、效能順(不爆 ticker)。
- 風格與美術一致;把有效的 FX 做法用 `kg-log` 存進 KG。
