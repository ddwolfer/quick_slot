# Knowledge Graph(KG)— 專案層接法

跨次累積「做 slot 的踩坑與套路」的本地知識庫。**完全專案層、不裝全域、不裝 agent 團隊**。

## 已整進 repo(本次)

- `mcp/knowledge-graph/` — KG MCP server(SQLite + sqlite-vec + FTS5 混合搜尋,本地 Qwen3 embedding)。來源:`github.com/ddwolfer/AI_team_start_template` 的 `mcp/knowledge-graph/`。
- `.mcp.json`(repo 根)— 只註冊 `knowledge-graph` 一個 server,**不含 agent-bridge**。路徑用本機絕對路徑;`env` 把 embedding 模型快取(`HF_HOME` / `TRANSFORMERS_CACHE`)釘在 `mcp/knowledge-graph/.cache`,**不落全域**。

> 刻意**未**整進:頂層 `scripts/initialize.js`(會把 `let-them-talk` 裝成 devDep 並 `git init` 重置,違反「專案層、不裝 agent 團隊」),以及 `.claude/settings.json` 的自動 hooks(見下方「選配」)。

## 啟用(需你親自做兩步)

KG 的原生套件編譯屬「執行外部 repo 程式」,需你授權,故由你手動跑:

```bash
cd C:\Users\91006\Desktop\QuickSlot\mcp\knowledge-graph
npm install          # 編譯 better-sqlite3 + 取 transformers(原生/ML 相依)
```

裝完**重啟 Claude Code**(MCP server 在啟動時載入)。第一次用到語意搜尋會下載 ~560MB 的 Qwen3 embedding 模型到 `mcp/knowledge-graph/.cache`(已 gitignore、專案層)。

### 驗證

- 重啟後看得到 `search_memory` / `store_knowledge`(及 `knowledge-graph` 其他工具)。
- **不**出現 `agent-bridge` 之類多 agent 團隊工具(本 repo 的 `.mcp.json` 沒註冊)。
- `mcp/knowledge-graph/knowledge.db` 在專案內生成(gitignore)。

> 若 `npm install` 在 node 24 上 better-sqlite3 編譯失敗,改用該套件有 prebuilt 的 Node LTS,或裝 VS Build Tools 後重試。

## 用法

接著用 `kg-log` skill:動手前 `search_memory("<關鍵字>")`,做完一小段 `store_knowledge`(類別 + 可複用內容 + 如何套用)。

## 選配:自動 recall hooks(你想要才自己加)

模板原本附 `.claude/settings.json` 生命週期 hooks。本次**未**自動寫入(改你的 agent 啟動設定屬自我修改,需你自行決定)。若要「每次送 prompt 自動撈相關記憶 + session 開始顯示 KG 狀態」,把下面併進你的 `.claude/settings.json`(裝好 deps 後才加,否則未裝前會無害報錯):

```jsonc
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup", "hooks": [{ "type": "command", "command": "node C:/Users/91006/Desktop/QuickSlot/mcp/knowledge-graph/hooks/session-start.js", "timeout": 10 }] },
      { "matcher": "compact", "hooks": [{ "type": "command", "command": "node C:/Users/91006/Desktop/QuickSlot/mcp/knowledge-graph/hooks/post-compact.js", "timeout": 10 }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node C:/Users/91006/Desktop/QuickSlot/mcp/knowledge-graph/hooks/auto-recall.js", "timeout": 10 }] }
    ]
  }
}
```

> 不建議照搬模板的 `Stop`(agent 型,每次停都跑 opus 自動截取,且 prompt 是 dangling 參考、會與 `/goal` hook 衝突)與 `PreToolUse` search-enforcer(ableton 專用、用 `process.env.HOME` 在 Windows 易壞、本專案 flag 不存在故無效)。
