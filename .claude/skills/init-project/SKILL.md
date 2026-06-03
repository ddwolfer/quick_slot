---
name: init-project
description: 剛 clone / 拿到 QuickSlot 模板後的「初次環境設定」——驗證工具鏈、裝依賴、跑通核心、(選配)啟用 KG,並導覽可用 skill 與 workflow。當使用者說「初次設定」「剛拿到模板」「setup / onboard」「第一次用這個框架」時使用。設定完接 quick-slot-spec 開始做遊戲。
---

# init-project

把一個新 clone 的 QuickSlot 框架帶到「可用」狀態,並讓使用者知道下一步用哪個 skill。
**這是整個框架的環境設定,不是 scaffold 一個遊戲**(scaffold 特定遊戲用 `init-quick-slot`)。

先讀 `CLAUDE.md`(工作規則 + 平台陷阱)與 `規格書.md`(架構與 §6 workflow),建立全貌。

## 步驟

1. **確認環境**:
   - 必要:`node -v`(≥ 18)、`npm -v`。
   - 選配:`python --version`(CLAUDE.md 的 null-byte 清理用);codex CLI(美術 `gen-slot-art` 用)。

2. **裝前端依賴 + 驗證可 build**:
   ```bash
   cd template
   npm install
   npx tsc --noEmit && npx vite build
   ```
   依 CLAUDE.md:**不要在 bash 跑 `npm run dev` / `vite`**(watch 會卡住);要實際玩請使用者自己開 dev server。掛載的 Windows 資料夾裝 node_modules 較慢,可複製一份到本機暫存目錄(Windows:`$env:TEMP`)再驗;in-place 直接裝也可(實測 ~11s)。

3. **驗證核心數學可跑**(前端與 sim 共用同一份 core):
   ```bash
   cd ..
   node tools/sim.mjs 100000           # 用 config 的 mechanic(預設 payline,RTP ~93–94%)
   node tools/sim.mjs 100000 ways       # 第三參數可覆寫玩法
   node tools/sim.mjs 100000 cluster    # cluster 另報 avg cascade
   ```
   > `ways` / `cluster` 這兩行只是確認「玩法參數有正確切換」;它們的 RTP 會**很離譜**(ways ~300%、cluster ~1700%),因為預設轉軸帶只為 payline 調過——切玩法後用 `tune-rtp` 重對才會正常。

4. **(選配)啟用 Knowledge Graph(專案層、不裝全域)**:
   ```bash
   cd mcp/knowledge-graph && npm install
   ```
   再**重啟 Claude Code**(MCP server 啟動時載入)。完整步驟、驗證、選配 hooks 見 `docs/knowledge-graph.md`。裝好後用 `kg-log` skill 累積跨次經驗。

5. **導覽可用 skill 與 workflow**(框架自帶,流程見 規格書 §6):
   - `quick-slot-spec` → 從主題產 `game.config.json` + 美術 brief。
   - `init-quick-slot` → 從 `template/` scaffold 一個遊戲資料夾。
   - `tune-rtp` → 校 RTP;`gen-slot-art` → 批次產符號美術。
   - `add-mechanic` / `add-event` → 加玩法 / 事件;`gen-slot-fx` / `add-sound` → 特效 / 音效。
   - `quick-slot-review` → 送審 / demo 前驗收;`kg-log` → 記錄經驗到 KG。

## 下一步

設定完成 → 用 `quick-slot-spec` 定第一個遊戲的主題與 config,接著 `init-quick-slot` scaffold,即進入 規格書 §6 的 workflow(spec → init → strips/RTP → art → review)。

## 驗收

- `template/` 下 `npx tsc --noEmit` + `npx vite build` 通過。
- `node tools/sim.mjs` 有正常 RTP 輸出。
- 使用者清楚下一步是 `quick-slot-spec`。
- (若啟用 KG)重啟後看得到 `search_memory` / `store_knowledge`,且無 agent-bridge。
