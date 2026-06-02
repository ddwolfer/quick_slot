// payline 評分：左到右連續同符號（wild 可替代），scatter 任意位置。
import { getLines } from '../paylines.js';

/**
 * @type {import('../types').Evaluator}
 */
export function evaluatePaylines(board, cfg, totalBet) {
  const lines = getLines(cfg);
  const lineBet = totalBet / lines.length;
  /** @type {Record<string, import('../types').SymbolDef>} */
  const byId = {};
  for (const s of cfg.symbols) byId[s.id] = s;
  const kind = (id) => byId[id]?.kind;
  const isWild = (id) => kind(id) === 'wild';
  const isScatter = (id) => kind(id) === 'scatter';

  /** @type {import('../types').GameEvent[]} */
  const events = [];
  let total = 0;

  lines.forEach((line, li) => {
    const seq = line.map((row, reel) => board[reel][row]);
    // base symbol = 第一個非 wild / 非 scatter
    let base = null;
    for (const s of seq) {
      if (!isWild(s) && !isScatter(s)) {
        base = s;
        break;
      }
    }
    if (base === null) return; // 整條都是 wild/scatter
    let count = 0;
    for (const s of seq) {
      if (s === base || isWild(s)) count++;
      else break;
    }
    const pay = byId[base]?.pay?.[String(count)];
    if (pay && count >= 3) {
      const amount = pay * lineBet;
      total += amount;
      events.push({
        type: 'win',
        line: li,
        positions: line.slice(0, count).map((row, reel) => [reel, row]),
        symbolId: base,
        count,
        amount,
      });
    }
  });

  // scatter：任意位置計數
  const scatter = cfg.symbols.find((s) => s.kind === 'scatter');
  if (scatter) {
    /** @type {[number, number][]} */
    const positions = [];
    for (let r = 0; r < board.length; r++) {
      for (let row = 0; row < board[r].length; row++) {
        if (board[r][row] === scatter.id) positions.push([r, row]);
      }
    }
    const c = positions.length;
    const pay = scatter.pay?.[String(c)];
    if (pay && c >= 3) {
      const amount = pay * totalBet;
      total += amount;
      events.push({ type: 'scatterWin', positions, symbolId: scatter.id, count: c, amount });
    }
  }

  return { events, totalWin: total };
}
