// 依符號數量產轉軸帶並寫回 game.config.json。
// 調整下面的 COUNTS 來控制 RTP / 命中率，再跑 sim.mjs 驗證。
// 用法：node tools/make-strips.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeRng } from '../template/src/core/rng.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfgPath = join(__dirname, '..', 'template', 'game.config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));

// 每軸各符號出現次數（越多越常見）。高賠符號少、低賠多、wild/scatter 稀有。
const COUNTS = {
  L4: 9,
  L3: 8,
  L2: 8,
  L1: 7,
  H4: 4,
  H3: 3,
  H2: 3,
  H1: 2,
  W: 2,
  S: 1,
};

function buildStrip(rng) {
  const a = [];
  for (const [id, n] of Object.entries(COUNTS)) {
    for (let i = 0; i < n; i++) a.push(id);
  }
  // Fisher–Yates 洗牌
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const rng = makeRng(777);
cfg.reelStrips = Array.from({ length: cfg.grid.reels }, () => buildStrip(rng));
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
console.log(`reelStrips 已更新；每軸長度 = ${cfg.reelStrips[0].length}`);
