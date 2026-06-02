---
name: quick-slot-review
description: QuickSlot 遊戲送審/demo 前的功能與手感驗收清單(非合規)。當使用者說「驗收」「review」「能 demo 了嗎」「上比賽前檢查」時使用。
---

# quick-slot-review

比賽 demo 前逐項檢查。聚焦功能與手感,不含 Stake 合規那套。

## 自動可驗(跑指令)

- [ ] `npx tsc --noEmit` 通過(先依 CLAUDE.md 清 null bytes)。
- [ ] `npx vite build` 成功,無 error。
- [ ] `node tools/sim.mjs 500000`:RTP 落在 `rtpTarget ± 3%`、命中率 30–55%、最大單轉合理(非無限大)。
- [ ] `game.config.json` 通過 JSON 解析、符號數 = 10。

## 人工確認(開 dev 玩)

- [ ] 按 SPIN / 空白鍵能轉,轉軸錯位停止、有回彈手感。
- [ ] 中獎:格子高亮 + 連線 + 中央 countup,金額與 evaluator 一致。
- [ ] scatter 命中有獨立高亮。
- [ ] 餘額正確扣注、加獎;押注加減正常;餘額不足會提示。
- [ ] 賠付表 modal 開得起來、內容對得上 config。
- [ ] **連續快速點 SPIN 不卡死、不疊圖**(驗 await 串好)。
- [ ] 視窗縮放不爆版(橫式優先)。
- [ ] 美術風格一致、看起來像成品(M2 後)。

## 升級項(若有做)

- [ ] cluster/tumble:消除→下落→補新→重判迴圈正確,連續多次 tumble 不卡(broadcastAsync/await + timeout)。
- [ ] hero FX(spine):pixi-spine 載入不報錯、動畫能播,遵守 pma:false / 不設 default attachment / set default animation。

## 記錄

- [ ] 把這次踩的坑、好用的 codex prompt、RTP 數據 `store_knowledge` 進 KG。
