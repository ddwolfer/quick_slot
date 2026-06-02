---
name: tune-rtp
description: 用 make-strips.mjs + sim.mjs 把某遊戲的 RTP 校到目標(payline / ways / cluster 皆適用)。當使用者說「對 RTP」「RTP 太高/太低」「校賠付」「調命中率/波動」時使用。
---

# tune-rtp

RTP 校正迴圈。核心心法:**RTP 與所有 pay 成線性**——離目標多遠,就把所有 pay 等比一次拉過去,再 sim 確認。轉軸帶頻率(符號稀有度)則是調命中率與波動的旋鈕。

## 步驟

1. **量基準**:
   ```bash
   node tools/sim.mjs 500000
   ```
   看 RTP / 命中率 / 最大單轉。seed 固定(`makeRng(123456)`),數據可重現。

2. **線性校 RTP(最快一步到位)**:實測 RTP=X%、目標 T%,就把 `game.config.json` 裡所有 `symbols[].pay` 的值 × (T / X),再 sim。例:X=94.2、T=95 → 全部 × 1.0085。scatter 的 pay 同樣縮放。

3. **調命中率 / 波動**(改頻率,非線性):編輯 `tools/make-strips.mjs` 的 `COUNTS`(高賠符號少、低賠多、wild/scatter 稀有),然後:
   ```bash
   node tools/make-strips.mjs      # 重產 reelStrips 寫回 config
   node tools/sim.mjs 500000       # 重新量
   ```
   符號越多越常見 → 命中率↑、單次量↓。改完頻率 RTP 會變,再回步驟 2 線性收尾。

4. **各玩法量級不同(切玩法後務必重對)**:
   - **payline**:`lineBet = totalBet / lines`,`pay × lineBet`。
   - **ways**:`lineBet = totalBet / (paylines ?? 20)`,`pay × ways × lineBet`。ways 會相乘放大,通常 RTP 比 payline 高很多(實測約 300%+),需把 pay 砍到約 1/8 再線性收。
   - **cluster**:`pay × totalBet`,門檻制(取 pay 中鍵 ≤ 群大小的最大值),連鎖會疊加;先設好 `minCluster` 與群 paytable 再對。用覆寫 mechanic 的 sim 量(見下)。

5. **量非預設玩法**:`sim.mjs` 第三個參數可覆寫玩法,不必改 config:
   ```bash
   node tools/sim.mjs 500000 ways      # 以 ways 量
   node tools/sim.mjs 200000 cluster   # 以 cluster 量(另報 avg cascade)
   ```

## 驗收

- RTP 落 `rtpTarget ± 3%`。
- 命中率 30–55%(payline / ways);cluster 另看平均 cascade 合理(約 < 3)。
- 最大單轉非無限大;改 config 後一定重跑 sim。
- 校好後把關鍵數據用 `kg-log` 存進 KG(如「ways 切換 pay × 0.13 → RTP 95%」)。
