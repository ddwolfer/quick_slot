# QuickSlot — Claude 工作規則

## 專案一句話

輕量、config 驅動的本地 PixiJS 8 slot 試玩框架。用途:比賽拿到題目後,用 AI 最短時間產出本地可玩 demo。**不是 Stake 架構、不接 RGS、不做合規。**

## 結構

- `template/` — 可重複使用模板(換遊戲時 clone 出去)。
- `games/` — 由 `init-quick-slot` 產出的各遊戲(從 template clone)。
- `tools/` — `sim.mjs`(估 RTP)、`make-strips.mjs`(產轉軸帶)、`gen-art.md`(codex 美術範本)。
- `.claude/skills/` — 工作流 skill:`quick-slot-spec` / `init-quick-slot` / `quick-slot-review`。
- `規格書.md` / `進度與驗收.md` — 設計與進度文件。

## 核心設計(務必維持)

- **玩法無關核心** `src/core/` 用純 JS + JSDoc,前端(Vite)與 `tools/sim.mjs`(Node)**共用同一份**,保證數學一致。改核心時兩邊一起驗。
- **玩法差異只體現在 evaluator 產出哪些 Event**;render 層用 handler map 播。新增玩法在 `evaluators/index.js` 註冊,tumble 在 `eventPlayer.ts` 加 case,**核心與 payline 不動**。
- **所有動畫一律 await**(`tween` 回傳 Promise,`eventPlayer` 逐事件 await)。借 StakeProject P0 教訓:fire-and-forget 會讓 round 卡死。

## 工具使用規則

專用工具優先於 Bash:讀檔用 `Read`、編輯用 `Edit`、寫新檔用 `Write`、搜尋用 `Grep`/`Glob`。

## 平台陷阱(本機實測)

- **這個資料夾覆寫檔案會殘留尾端 null bytes** — 用 `Write`/`Edit` 覆寫既有檔後,檔尾可能多出 `\x00`,導致 `tsc` 報 `error TS1127: Invalid character` 或 `node` 報 JSON `Extra data`。修法:
  ```bash
  python3 -c "import pathlib
  for f in pathlib.Path('.').rglob('*'):
      if f.is_file() and f.suffix in {'.ts','.js','.json','.html','.md','.mjs'}:
          b=f.read_bytes(); c=b.rstrip(b'\x00')
          if c!=b: f.write_bytes(c+(b'' if c.endswith(b'\n') else b'\n'))"
  ```
  改完檔案後若要 build,先跑一次這個清理。
- **不要在 Bash 跑 `npm run dev` / `vite`** — watch mode 不會退出,會卡住 Bash。要驗證時:`npx tsc --noEmit`(型別)+ `npx vite build`(bundle,會正常結束),或提醒使用者自己開 dev server。
- npm 安裝 / build 在 sandbox 本地目錄(如 `/tmp`)跑較快,別在掛載的 Windows 資料夾裝 node_modules。

## RTP 調校流程

1. 改 `template/game.config.json` 的 paytable / 符號。
2. `node tools/make-strips.mjs`(調 `COUNTS` 控制頻率)→ `node tools/sim.mjs 500000` 看 RTP。
3. **RTP 與 paytable 成線性**:若 RTP=X% 想到 95%,把所有 pay × (95/X) 即可一次到位,再 sim 確認。

## 送審(比賽) checklist

提交前對照 `.claude/skills/quick-slot-review`,逐項檢查功能與手感(非合規)。

## Knowledge Graph(已接,專案層)

KG(`knowledge-graph` MCP)用來跨次累積做 slot 的踩坑與套路。已整進 repo(`mcp/knowledge-graph/` + 根 `.mcp.json`,**專案層、不裝全域**);啟用需在 `mcp/knowledge-graph/` 跑一次 `npm install` + 重啟 Claude Code,細節見 `docs/knowledge-graph.md`。用法走 `kg-log` skill:每做完一小段(一個 bug、一次 RTP 調校、一條 codex prompt 心得)就 `store_knowledge`;動手前先 `search_memory`。**比賽期間不用 agent-bridge 多 agent 團隊**(過度工程);美術用 Claude Code 內建 subagent 平行呼叫 codex 即可。
