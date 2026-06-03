# 美術產生範本（codex-imagegen）

用 SpineAI 的 `codex-imagegen` skill 產符號 / 背景 / logo（透明 PNG）。
建議在 Claude Code 用 **subagent 平行** 跑，每個符號一個任務。

腳本路徑：
`C:\Users\91006\Desktop\cowork\SpineAI\.claude\skills\codex-imagegen\scripts\codex_imagegen.py`

## 通用注意（來自 skill 的踩坑）

- `CODEX_TIMEOUT` 別低於 250（產圖要 150–300 秒）。
- prompt 不要要求精確數字/文字（會漂移）；數字（如「x2」）之後用文字疊上去。
- 暫存目錄用 workspace 相對路徑（如 `./out/staging`），**不要放系統 Temp**（ACL 會鎖）。
- 每張產完人工挑 variant，確認風格一致。
- 輸出尺寸：符號建議 512×512，落地後縮到 cell 大小（120）。

## 呼叫範本（Olympus 主題，逐符號）

```bash
PY="python C:\Users\91006\Desktop\cowork\SpineAI\.claude\skills\codex-imagegen\scripts\codex_imagegen.py"

# 高賠符號
$PY "Zeus head, greek god, marble and gold, slot machine symbol icon, centered, bold rim light, transparent background" -o ./public/assets/staging/H1 -n 3
$PY "Poseidon trident, ocean blue and gold, slot symbol icon, centered, transparent background" -o ./public/assets/staging/H2 -n 3
$PY "Athena owl with helmet, gold and teal, slot symbol icon, centered, transparent background" -o ./public/assets/staging/H3 -n 3
$PY "Hades dark crown, purple and black flame, slot symbol icon, centered, transparent background" -o ./public/assets/staging/H4 -n 3

# 低賠符號（撲克字母，做成希臘石雕風格）
$PY "letter A carved in greek marble column style, gold trim, slot symbol, transparent background" -o ./public/assets/staging/L1 -n 2
$PY "letter K carved in greek marble, gold trim, slot symbol, transparent background" -o ./public/assets/staging/L2 -n 2
$PY "letter Q carved in greek marble, gold trim, slot symbol, transparent background" -o ./public/assets/staging/L3 -n 2
$PY "letter J carved in greek marble, gold trim, slot symbol, transparent background" -o ./public/assets/staging/L4 -n 2

# Wild / Scatter
$PY "golden laurel wreath WILD emblem, radiant, slot symbol, transparent background" -o ./public/assets/staging/W -n 3
$PY "glowing greek temple bonus coin, scatter symbol, ornate, transparent background" -o ./public/assets/staging/S -n 3

# 背景 / logo
$PY "Mount Olympus clouds and golden temple, dark blue cinematic slot background, no text, landscape 16:9" -o ./public/assets/staging/bg -n 2
$PY "OLYMPUS GODS slot game logo, golden greek lettering, ornate emblem, transparent background" -o ./public/assets/staging/logo -n 2
```

## 落地（換掉 placeholder 色塊）

> 程式已內建「manifest 驅動」drop-in,**不必再改任何程式碼**——`symbols.ts` 已有
> Sprite 路徑、`main.ts` 已用 `loadGameAssets` 預載並自動接背景/ logo。落地只要兩步:

1. 從 staging 挑好的 PNG,命名 `H1.png`…`S.png`、`bg.png`、`logo.png`,放 `template/public/assets/`。
2. 寫 `template/public/assets/manifest.json`:
   ```json
   { "symbols": ["H1","H2","H3","H4","L1","L2","L3","L4","W","S"], "background": "bg.png", "logo": "logo.png" }
   ```
3. `npm run dev` 確認:符號變圖、背景/ logo 出現;缺圖的符號自動 fallback 色塊。

(完整步驟、平行 subagent、驗收見 `gen-slot-art` skill。)
