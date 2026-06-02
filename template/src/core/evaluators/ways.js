// ways 評分(如 243 ways):從第 0 軸起,相鄰軸只要出現同符號就累積。
// 某符號的中獎 ways = 各連續軸「該符號(含 wild)出現格數」相乘;
// 賠付 = pay[連續軸數] × ways × lineBet。wild 替代,scatter 任意位置(同 payline)。
//
// lineBet = totalBet / (cfg.paylines ?? 20):刻意沿用 payline 的「以小單位計價」,
// 讓同一份 paytable 量級可重用、RTP 可線性校正(見 tune-rtp skill)。
// 切到 ways 後務必重跑 sim 重新對 RTP(ways 的命中分佈與 payline 不同)。

/**
 * @type {import('../types').Evaluator}
 */
export function evaluateWays(board, cfg, totalBet) {
  const reels = board.length;
  const lineBet = totalBet / (cfg.paylines ?? 20);

  /** @type {Record<string, import('../types').SymbolDef>} */
  const byId = {};
  for (const s of cfg.symbols) byId[s.id] = s;
  const kind = (id) => byId[id]?.kind;
  const isWild = (id) => kind(id) === 'wild';

  /** @type {import('../types').GameEvent[]} */
  const events = [];
  let total = 0;

  // 候選 base = 所有非 wild / 非 scatter 符號
  const bases = cfg.symbols.filter((s) => s.kind !== 'wild' && s.kind !== 'scatter');
  for (const sym of bases) {
    const baseId = sym.id;
    let ways = 1;
    let matchedReels = 0;
    /** @type {[number, number][]} */
    const positions = [];
    for (let r = 0; r < reels; r++) {
      /** @type {number[]} */
      const rowsHit = [];
      for (let row = 0; row < board[r].length; row++) {
        const cell = board[r][row];
        if (cell === baseId || isWild(cell)) rowsHit.push(row);
      }
      if (rowsHit.length === 0) break; // 連續中斷
      ways *= rowsHit.length;
      matchedReels++;
      for (const row of rowsHit) positions.push([r, row]);
    }
    const pay = sym.pay?.[String(matchedReels)];
    if (pay && matchedReels >= 3) {
      const amount = pay * ways * lineBet;
      total += amount;
      events.push({
        type: 'win',
        line: -1, // ways 無「線」概念;render 端用 line < 0 判斷不畫連線
        positions,
        symbolId: baseId,
        count: matchedReels,
        amount,
      });
    }
  }

  // scatter:任意位置計數(與 payline 一致)
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
