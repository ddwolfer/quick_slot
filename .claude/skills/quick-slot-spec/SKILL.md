---
name: quick-slot-spec
description: 從一個比賽題目/主題產出 QuickSlot 的 game.config.json 與美術 brief。當使用者說「用 X 主題做一個 slot」「拿到題目了」「幫我設計符號/賠付表」時使用。產出 config 後接 init-quick-slot 開始搭。
---

# quick-slot-spec

把一個主題(例如「希臘神」「埃及」「3 pot」)變成一份可被 QuickSlot 引擎吃的 `game.config.json` + 一份美術 brief。

## 步驟

1. **確認關鍵參數**(若使用者沒講,用 AskUserQuestion 問,預設值見括號):
   - 主題 theme(必問)
   - 玩法 mechanic(預設 `payline`;ways/cluster 屬 M3 升級,先別選除非明確要)
   - 格子 grid(預設 5×3)、線數 paylines(預設 25)
   - RTP 目標(預設 0.95)
   - 押注級距 bet.levels(預設 `[0.2,0.5,1,2,5,10]`)

2. **設計符號**:固定 10 個 —— 4 高賠(H1–H4)、4 低賠(L1–L4,通常 A/K/Q/J)、1 wild(W)、1 scatter(S)。
   - 依主題給每個 `label` 與 placeholder `color`。
   - paytable 用慣例量級(× 線注):高賠 5-連約 300–800、低賠 5-連約 80–160、3-連高賠約 20–40、低賠約 8–16。scatter 用 × 總注:`{"3":5,"4":25,"5":150}`。wild 不給 pay。

3. **寫 `template/game.config.json`**(或目標遊戲資料夾的 config)。用 `Write`;寫完若之後要 build,記得依 CLAUDE.md 清 null bytes。

4. **產轉軸帶 + 對 RTP**:
   ```bash
   node tools/make-strips.mjs      # 調 COUNTS 控制頻率
   node tools/sim.mjs 500000       # 看 RTP / 命中率
   ```
   RTP 與 paytable 成線性:離目標多遠,就把所有 pay × (target/實測) 一次校正,再 sim 確認落在 ±3%。

5. **產美術 brief**:依主題,把 `tools/gen-art.md` 的 prompt 範本改成這個主題的 10 個符號 + 背景 + logo 描述,交給 init-quick-slot / 美術 subagent。

## 驗收

- `node tools/sim.mjs` RTP 落在 `rtpTarget ± 3%`、命中率 30–55%。
- config 通過 `python3 -c "import json;json.load(open(...))"`(無 null bytes / 語法錯)。
- 符號數 = 10、paytable 欄位齊全。
