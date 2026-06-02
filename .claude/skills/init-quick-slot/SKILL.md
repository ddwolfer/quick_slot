---
name: init-quick-slot
description: 從 template/ scaffold 一個新的 QuickSlot 遊戲、注入 config、產轉軸帶、跑到 placeholder 可玩。當使用者說「開一個新 slot」「scaffold」「建一個遊戲專案」時使用。通常接在 quick-slot-spec 之後。
---

# init-quick-slot

把 `template/` 複製成一個新遊戲,接上 config,確認能本地試玩。

## 步驟

1. **取名**:向使用者確認遊戲代號(kebab-case,如 `olympus-gods`)。目標路徑 `games/<name>/`。

2. **複製模板**:
   ```bash
   mkdir -p games/<name>
   cp -r template/. games/<name>/
   ```
   (`tools/` 留在 repo 根層共用;`sim.mjs`/`make-strips.mjs` 內的相對路徑預設指向 `template/`,若要對 `games/<name>` 跑,複製一份 tools 進去或改路徑。)

3. **放入 config**:把 quick-slot-spec 產的 `game.config.json` 覆蓋到 `games/<name>/game.config.json`。

4. **產轉軸帶 + sim**(在該遊戲目錄,或暫時把根 tools 指向它):
   ```bash
   node tools/make-strips.mjs
   node tools/sim.mjs 300000
   ```

5. **驗證可跑(空殼)**:在 sandbox 本地複製一份做 build 驗證,**不要在 Bash 跑 dev**:
   ```bash
   rm -rf /tmp/qsg && cp -r games/<name> /tmp/qsg && cd /tmp/qsg
   npm install --no-audit --no-fund
   npx tsc --noEmit && npx vite build
   ```
   (build 前依 CLAUDE.md 清 null bytes。)

6. **交給使用者試玩**:提醒他在終端跑 `cd games/<name> && npm install && npm run dev`,開 http://localhost:5173,按 SPIN / 空白鍵。

## 驗收

- `tsc --noEmit` 通過、`vite build` 成功。
- placeholder 色塊能轉、能停、中獎會高亮、餘額正確增減。
- 接著進 M2(美術,見 `tools/gen-art.md`)。
