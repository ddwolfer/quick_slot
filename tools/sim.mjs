// 本地估 RTP。用法：node tools/sim.mjs [spins]
// 與前端共用同一份 core，保證數學一致。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeRng } from '../template/src/core/rng.js';
import { spin } from '../template/src/core/engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfgPath = join(__dirname, '..', 'template', 'game.config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));

const N = Number(process.argv[2] ?? 300000);
const rng = makeRng(123456);
const bet = cfg.bet.default;

let sum = 0;
let hits = 0;
let max = 0;
let scatterHits = 0;

for (let i = 0; i < N; i++) {
  const r = spin(cfg, rng, bet);
  if (r.totalWin > 0) {
    hits++;
    if (r.totalWin > max) max = r.totalWin;
  }
  if (r.events.some((e) => e.type === 'scatterWin')) scatterHits++;
  sum += r.totalWin;
}

const rtp = (sum / (N * bet)) * 100;
console.log(`spins=${N}`);
console.log(`RTP      = ${rtp.toFixed(2)}%   (target ${(cfg.rtpTarget * 100).toFixed(0)}%)`);
console.log(`hit rate = ${((hits / N) * 100).toFixed(2)}%`);
console.log(`scatter  = ${((scatterHits / N) * 100).toFixed(3)}% of spins`);
console.log(`max win  = ${(max / bet).toFixed(1)}x`);
