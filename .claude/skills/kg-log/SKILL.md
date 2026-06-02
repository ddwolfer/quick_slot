---
name: kg-log
description: 把這次學到的坑、好用的 codex prompt、RTP 數據存進 Knowledge Graph(store_knowledge);動手前先 search_memory 查舊經驗。當使用者說「記到 KG」「存知識」「記錄這次踩坑」,或每做完一小段時使用。需 knowledge-graph MCP(見 repo .mcp.json)。
---

# kg-log

跨次累積「做 slot 的踩坑與套路」,讓下一題比賽能撈回。前提:`knowledge-graph` MCP 已接(repo 根 `.mcp.json`;若工具不在,先依 進度與驗收.md 的 KG 段裝)。

## 時機

- **動手前**:`search_memory("<主題/問題關鍵字>")`,把找到的舊套路直接套用,別重踩。
- **每做完一小段**(一個 bug、一次 RTP 調校、一條有效 codex prompt、一個 pixi 寫法)就 `store_knowledge`,趁記憶新鮮。

## 步驟

1. 動手前 `search_memory`,讀回相關節點。
2. 做完後 `store_knowledge`,內容含:
   - **類別**:`rtp` / `codex-prompt` / `pixi` / `mechanic` / `art` / `platform`。
   - **可複用具體內容**:數據或片段,例如「ways 切換後 pay × 0.13 → RTP 95%」「Zeus 符號有效 prompt 全文」「覆寫檔殘留 null byte 用 python rstrip 清」。
   - **為何 / 如何套用**:下次什麼情境會用到。
3. `connect_knowledge` 把相關節點關聯(同主題 / 同遊戲 / 同類坑)。

## 值得記的(本框架常見)

- RTP 校正數據與線性係數(各玩法量級)。
- 有效 codex imagegen prompt 與陷阱(timeout、暫存位置)。
- `@pixi/sound` / `Assets` / manifest 開關接法。
- cluster tumble 卡點與 await 串法。
- 本機 null-byte / CRLF 清理。

## 驗收

- `search_memory` 找得回剛存的節點。
- 比賽下一題能用關鍵字撈到相關套路,縮短重做時間。
