# QuickSlot 後續開發任務 — Claude Code 接力 prompt

> 用法:在 `C:\Users\91006\Desktop\QuickSlot` 開 Claude Code,把下面「=== PROMPT ===」整段貼進去(高 effort)。

=== PROMPT ===

你現在在 `C:\Users\91006\Desktop\QuickSlot`(以下稱 repo)工作。這是一個輕量、config 驅動的本地 PixiJS 8 slot 試玩框架,目的:公司 AI 比賽拿到題目後,用 AI 最短時間產出本地可玩 demo。**不是 Stake 架構、不接 RGS、不做合規。** 目前 M0 骨架 + M1 payline 可玩已完成並驗證(tsc/vite build 通過、RTP 模擬 94.2%)。

## 先讀(務必,照順序)
1. `規格書.md` — 完整設計、檔案結構、workflow(§6)、驗收(§7)。
2. `進度與驗收.md` — 目前進度與已驗證項目。
3. `CLAUDE.md` — 工作規則與平台陷阱(**特別注意 null bytes 與不要在 bash 跑 vite dev**)。
4. `template/src/` 全部現有程式碼、`template/game.config.json`、`tools/`。
5. 參考顆粒度:`D:\AI\StakeProject\.claude\skills\`(skill 寫法)、`C:\Users\91006\Desktop\cowork\SpineAI\.claude\skills\codex-imagegen`(美術,成熟可直接用)、`spineai-patterns` / `gen-spine`(FX,半成品,省著用)。

## 鐵則
- 玩法無關核心 `src/core/` 是純 JS,前端(Vite)與 `tools/sim.mjs`(Node)**共用同一份**,改動兩邊一起驗。
- 所有動畫一律 `await`(借 StakeProject P0 教訓:fire-and-forget 會卡 round)。
- 覆寫既有檔後檔尾可能殘留 `\x00` → build/parse 前先跑 `CLAUDE.md` 裡的 null-byte 清理指令。
- **不要在 bash 跑 `npm run dev` / `vite`**(watch 卡住);驗證用 `npx tsc --noEmit` + `npx vite build`,在 `/tmp` 複製一份跑、別把 node_modules 裝進掛載資料夾。
- 每完成一個有意義單元,主動 `git commit`(中文 message,格式 `type: 描述`)。
- 一開始先用 TodoWrite 列出 TODO,逐項做;要決策或卡住先問我,不要硬猜。

## 任務 A — 補齊 skill 套件(對齊 StakeProject 顆粒度)
現有 3 個(`quick-slot-spec` / `init-quick-slot` / `quick-slot-review`)。新增以下,放 `.claude/skills/<name>/SKILL.md`,YAML frontmatter(`name` + `description`,description 要明確寫觸發時機),body 寫步驟 + 驗收:
- `tune-rtp` — `make-strips.mjs` + `sim.mjs` 的 RTP 校正迴圈;含「RTP 與 paytable 成線性,pay × (target/實測) 一次到位」的方法。
- `gen-slot-art` — 用 `codex-imagegen` 批次產 10 符號 + 背景 + logo,**subagent 平行**;落地後把 `src/render/symbols.ts` 的 Graphics 色塊換成 `Sprite`,`main.ts` 用 `Assets.load` 預載 `public/assets/*.png`。注意 codex 陷阱(timeout≥250、prompt 別要精確數字、暫存別放系統 Temp)。
- `add-mechanic` — 新增 evaluator(`ways.js` / `cluster.js`),在 `evaluators/index.js` 註冊;cluster 要產 tumble events + 新增 `src/render/TumbleLayer.ts`,在 `eventPlayer.ts` 加 `tumble` case。核心與 payline 不可動。
- `add-event` — 新增一個 Event type(改 `core/types.d.ts`)+ 對應 handler(`eventPlayer.ts`),對齊 Stake `add-event`。
- `gen-slot-fx` — 用 `spineai` 產 1–2 個 hero FX(wild/scatter 脈動/旋轉),用 `pixi-spine` 載入;不行就退回 PixiJS tween/particle,不要卡在 spine。
- `add-sound` — 依 `規格書.md` §9.1 的音效規格,用 `@pixi/sound` 接 BGM/SFX(初期可只接 spin/win/reel-stop)。
- `kg-log` — 把學到的坑、好用的 codex prompt、RTP 數據 `store_knowledge` 進 KG(見任務 B)。

## 任務 B — 接 Knowledge Graph(只裝 KG,不裝 agent 團隊)
- 來源:`https://github.com/ddwolfer/AI_team_start_template`(KG 是 `node mcp/knowledge-graph/main.js` 的 MCP server + `.claude/settings.json` 生命週期 hook)。
- 做法:`git clone` 到暫存,把 `mcp/knowledge-graph/`、`scripts/`、`.mcp.json`、`.claude/settings.json` 整進 repo;或在 repo 根跑 `node scripts/initialize.js --name "QuickSlot" --desc "本地 PixiJS slot 試玩框架" --no-team`(`--no-team` = 不裝 let-them-talk 多 agent)。
- 把 `.mcp.json` 的 `{{PROJECT_ROOT}}` 換成 repo 絕對路徑。
- 驗證:重啟 Claude Code 後看得到 `knowledge-graph` MCP 工具(`search_memory` / `store_knowledge`),且不出現 `agent-bridge`。

## 任務 C — M2 美術
用 `gen-slot-art` 把現在的 placeholder 色塊換成真圖。主題沿用 `Olympus Gods`(或依使用者新題目)。完成後遊戲應該「看起來像成品」。

## 任務 D(選配)— M3 升級
實作 cluster + tumble(最炫)或 ways。動手前先問使用者要哪個。

## 驗收
每個任務完成後對照 `.claude/skills/quick-slot-review` 逐項檢查;M2/M3 完成跑完整 review 並 commit。最後回報:做了什麼、驗證結果、還剩什麼。

=== END PROMPT ===
