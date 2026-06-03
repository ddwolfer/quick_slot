# QuickSlot

> 輕量、config 驅動的本地 **PixiJS 8** slot 試玩框架。
> 用途:比賽拿到題目後,用 AI 最短時間產出一個本地可玩的 slot demo。
> **不是 Stake 架構、不接 RGS、不做合規。**

config 換一份 + 美術換一批,就是一個新遊戲。核心做成**玩法無關**,payline / ways / cluster(含 tumble 連鎖)可由設定切換。

---

## 快速開始

剛 clone 下來?直接讓 Claude 跑 **`init-project`** skill 做初次設定(驗證環境、裝依賴、跑通核心、導覽 skill)。或手動:

```bash
cd template
npm install
npm run dev          # http://localhost:5173,按 SPIN 或空白鍵
```

估 RTP(前端與此共用同一份 core,數學一致):

```bash
node tools/sim.mjs 500000            # 用 config 的 mechanic
node tools/sim.mjs 500000 ways       # 第三參數可覆寫玩法
node tools/sim.mjs 200000 cluster    # cluster 另報 avg cascade
```

> ⚠️ 平台陷阱(務必先讀 `CLAUDE.md`):覆寫檔可能殘留尾端 null bytes;**不要在 bash 跑 `npm run dev` / `vite`**(watch 會卡);node_modules 別裝在掛載的 Windows 資料夾。

---

## 結構

```
QuickSlot/
├─ template/                 # 可重複使用模板（clone 出去做新遊戲）
│  ├─ src/core/              # ★ 玩法無關核心（純 JS,前端與 tools/sim.mjs 共用）
│  │  ├─ rng.js engine.js paylines.js
│  │  └─ evaluators/         # payline.js / ways.js / cluster.js（+ index.js 註冊）
│  ├─ src/render/            # PixiJS：reels · winPresenter · TumbleLayer · sound · eventPlayer
│  ├─ src/assets/manifest.ts # 美術 drop-in 載入器（manifest 驅動）
│  ├─ src/ui/                # HTML 控制列 + 賠付表
│  ├─ public/assets/         # 美術 / 音效（丟檔 + manifest.json 即生效）
│  └─ game.config.json       # 換遊戲主要只改這裡
├─ tools/                    # sim.mjs（估 RTP）· make-strips.mjs（產轉軸帶）· gen-art.md
├─ mcp/knowledge-graph/      # 選配：專案層 Knowledge Graph MCP（見 docs/knowledge-graph.md）
├─ .claude/skills/           # 11 個工作流 skill（見下）
├─ docs/                     # knowledge-graph.md
├─ 規格書.md                 # 完整設計、檔案結構、§6 workflow、驗收
├─ 進度與驗收.md             # 目前進度與已驗證項目
└─ CLAUDE.md                 # 工作規則與平台陷阱
```

---

## 核心設計

- **玩法無關核心** `src/core/`:`engine.spin()` 抽盤面 → evaluator 評分 → 回傳一串 `Event[]`,render 層用 handler map 逐一 **await** 播(取代 RGS 的 BookEvent round-trip)。
- **玩法差異只體現在 evaluator 產哪些 Event**;新增玩法在 `evaluators/index.js` 註冊,連鎖類在 `eventPlayer.ts` 加 case + 接 `TumbleLayer`,**核心與 payline 不動**。
- **所有動畫一律 await**(借 StakeProject 教訓:fire-and-forget 會讓 round 卡死)。

### 三種玩法(改 `game.config.json` 的 `mechanic` 切換)

| mechanic | 說明 |
|---|---|
| `payline` | 左到右連線(預設,RTP 已對到 ~94%) |
| `ways` | 相鄰軸 ways 計數(wild 替代) |
| `cluster` | 正交成群 + tumble 連鎖消除(另設 `minCluster`) |

> 切到 ways / cluster 後用 `tune-rtp` 重新對 RTP(量級與 payline 不同)。

### 美術 / 音效 drop-in

- 美術:把 PNG 丟 `template/public/assets/` + 寫 `public/assets/manifest.json` → 自動以 `Sprite` 取代 placeholder 色塊;無美術 fallback 色塊、**零 404**。
- 音效:把音檔丟 `public/assets/audio/` + 寫 `audio/manifest.json` → `@pixi/sound` 接 spin/reel-stop/win/BGM;無音檔全程靜音、不報錯。
- **兩者落地都不必改程式碼。**

---

## Skill 與 Workflow

框架自帶 11 個 skill(`.claude/skills/`)。典型流程(規格書 §6):

| 階段 | skill |
|---|---|
| 初次設定 | **`init-project`** |
| 定主題 → config | `quick-slot-spec` |
| scaffold 遊戲 | `init-quick-slot` |
| 對 RTP | `tune-rtp` |
| 產美術 | `gen-slot-art` |
| 加玩法 / 事件 | `add-mechanic` · `add-event` |
| 特效 / 音效 | `gen-slot-fx` · `add-sound` |
| 送審驗收 | `quick-slot-review` |
| 累積經驗 | `kg-log` |

---

## Knowledge Graph(選配,專案層)

跨次累積做 slot 的踩坑與套路。已整進 repo(`mcp/knowledge-graph/` + 根 `.mcp.json`,**專案層、不裝全域、不含 agent 團隊**)。啟用:`cd mcp/knowledge-graph && npm install` → 重啟 Claude Code。細節見 `docs/knowledge-graph.md`。

---

## 狀態

M0 骨架 + M1 payline 可玩 + M3 玩法(ways / cluster / tumble)+ 美術/音效 drop-in + 專案層 KG。詳見 `進度與驗收.md`。
