---
name: gen-slot-art
description: 用 codex-imagegen 批次產 10 符號 + 背景 + logo 的透明 PNG,落地 public/assets 讓遊戲像成品。當使用者說「產美術」「換掉色塊」「做符號圖」「M2 美術」時使用。需 SpineAI 的 codex-imagegen 與 codex CLI。
---

# gen-slot-art

把 placeholder 色塊換成真圖。落地路徑已就緒:`loadGameAssets`(`src/assets/manifest.ts`)以 `public/assets/manifest.json` 為開關,有美術自動以 `Sprite` 取代色塊、背景/ logo 自動 Sprite 化——**落地只需丟 PNG + 寫 manifest,程式碼不必改**。

## 步驟

1. **準備 prompt**:依主題改 `tools/gen-art.md` 範本(10 符號 + 背景 + logo)。每個 prompt:置中、透明背景、rim light、風格詞一致;**別要求精確數字/文字**(會漂移,數字之後用文字疊)。

2. **平行產圖(subagent)**:派多個 Claude Code subagent,各跑一個符號的 `codex_imagegen.py`,平行才划算(單張 150–300s)。
   - 腳本:`C:\Users\91006\Desktop\cowork\SpineAI\.claude\skills\codex-imagegen\scripts\codex_imagegen.py`
   - 範例:`python <腳本> "<prompt>" -o ./template/public/assets/staging/H1 -n 3`
   - 陷阱:`CODEX_TIMEOUT` ≥ 250;暫存用 workspace 相對路徑(`./...staging`,已被 .gitignore),**別放系統 Temp**(ACL 會鎖);`-n` 多產幾張人工挑。

3. **挑圖落地**:從 `staging/` 挑風格一致的,命名 `H1.png`…`S.png`、`bg.png`、`logo.png`,放 `template/public/assets/`。

4. **寫 manifest(開關)**:`template/public/assets/manifest.json`
   ```json
   { "symbols": ["H1","H2","H3","H4","L1","L2","L3","L4","W","S"], "background": "bg.png", "logo": "logo.png" }
   ```
   `loadGameAssets` 看到 manifest 才載;只載清單列出的檔(零 404)。沒列到的符號自動 fallback 色塊。

5. **驗證**:`npm run dev`,符號變圖、背景/ logo 出現。每張檢查:RGBA 透明背景、≥ 1% 不透明像素、尺寸一致(建議 512×512,落地自動縮到 cell)。

## 驗收

- 看起來像成品、風格一致;缺圖的符號自動 fallback 色塊不破版。
- `npx tsc --noEmit` + `npx vite build` 仍過。
- 最終 PNG 與 `manifest.json` 進版控;`staging/` 不進(已 gitignore)。
- 有效 prompt 用 `kg-log` 存進 KG。
