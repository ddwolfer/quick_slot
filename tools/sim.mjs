// 本地估 RTP。用法：node tools/sim.mjs [spins] [mechanic]
//   例：node tools/sim.mjs 500000           # 用 config 的 mechanic
//       node tools/sim.mjs 500000 ways       # 覆寫成 ways 來對 RTP
//       node tools/sim.mjs 200000 cluster    # cluster 另報 avg cascade
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
// 選配:第三個參數覆寫玩法(payline | ways | cluster),方便切玩法後對 RTP。
const mech = process.argv[3];
if (mech) cfg.mechanic = mech;

const rng = makeRng(123456);
const bet = cfg.bet.default;

let sum = 0;
let hits = 0;
let max = 0;
let scatterSpins = 0;
let tumbles = 0;

for (let i = 0; i < N; i++) {
  const r = spin(cfg, rng, bet);
  if (r.totalWin > 0) {
    hits++;
    if (r.totalWin > max) max = r.totalWin;
  }
  let hadScatter = false;
  for (const e of r.events) {
    if (e.type === 'scatterWin') hadScatter = true;
    else if (e.type === 'tumble') tumbles++;
  }
  if (hadScatter) scatterSpins++;
  sum += r.totalWin;
}

const rtp = (sum / (N * bet)) * 100;
console.log(`spins=${N}   mechanic=${cfg.mechanic}`);
console.log(`RTP      = ${rtp.toFixed(2)}%   (target ${(cfg.rtpTarget * 100).toFixed(0)}%)`);
console.log(`hit rate = ${((hits / N) * 100).toFixed(2)}%`);
console.log(`scatter  = ${((scatterSpins / N) * 100).toFixed(3)}% of spins`);
console.log(`max win  = ${(max / bet).toFixed(1)}x`);
if (cfg.mechanic === 'cluster') {
  console.log(`avg cascade = ${(tumbles / N).toFixed(3)} tumbles/spin`);
}
