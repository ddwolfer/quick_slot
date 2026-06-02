// cluster 評分 + tumble 連鎖。正交相鄰、同符號(wild 替代)成群 ≥ minCluster 即中獎;
// 中獎符號消除 → 上方落下 → 頂端由轉軸帶補新 → 重新評分,迴圈到無群為止。
//
// 產出的 Event 串流(engine 會在前後包 reveal / totalWin):
//   win(每群) → tumble(removed + 補新後 board) → win → tumble → ... (無群則停)
// render 端:eventPlayer 的 'tumble' case 交給 TumbleLayer 播,核心與 payline 不需知道 tumble。
//
// 規則簡化(demo 取向,可由各遊戲 paytable 重新調):
// - base = 非 wild/非 scatter;flood-fill 連通格(cell==base 或 wild)。
// - 一群至少含 1 個非 wild 的 base 格(避免純 wild 成群)。wild 可被多個 base 群共用。
// - scatter 視為阻隔(不入群、不在此計分;若需 scatter 觸發免費,另接 add-mechanic)。
// - 群賠付:取 symbol.pay 中「鍵 ≤ 群大小」的最大鍵(門檻制),× totalBet。
import { randInt } from '../rng.js';

/**
 * @type {import('../types').Evaluator}
 */
export function evaluateCluster(board, cfg, totalBet, rng) {
  const rand = rng ?? Math.random;
  const reels = cfg.grid.reels;
  const rows = cfg.grid.rows;
  const minCluster = cfg.minCluster ?? 5;

  /** @type {Record<string, import('../types').SymbolDef>} */
  const byId = {};
  for (const s of cfg.symbols) byId[s.id] = s;
  const kind = (id) => byId[id]?.kind;
  const isWild = (id) => kind(id) === 'wild';
  const isScatter = (id) => kind(id) === 'scatter';

  /** @type {import('../types').GameEvent[]} */
  const events = [];
  let total = 0;

  let working = board.map((col) => col.slice());
  let guard = 0;
  while (guard++ < 50) {
    const clusters = findClusters(working, reels, rows, minCluster, isWild, isScatter);
    if (clusters.length === 0) break;

    // wild 可同時屬多個 base 群,cl.cells 會重複到同一個 wild 格——
    // 用 Map 去重,確保 tumble 的 removed 每格只出現一次(否則 render 端
    // newCount 會多算、survivor/fresh 落錯列,且同一 Container 被 destroy 兩次)。
    /** @type {Map<string, [number, number]>} */
    const removedMap = new Map();
    for (const cl of clusters) {
      const pay = clusterPay(byId[cl.symbolId], cl.size);
      if (pay > 0) {
        const amount = pay * totalBet;
        total += amount;
        events.push({
          type: 'win',
          line: -1, // cluster 無線;render 端只高亮格子
          positions: cl.cells,
          symbolId: cl.symbolId,
          count: cl.size,
          amount,
        });
      }
      for (const c of cl.cells) removedMap.set(c[0] + ',' + c[1], c);
    }
    const removedAll = [...removedMap.values()];

    const newBoard = collapseRefill(working, removedAll, cfg, rand);
    events.push({ type: 'tumble', removed: removedAll, board: newBoard });
    working = newBoard;
  }

  return { events, totalWin: total };
}

/**
 * 找出所有 ≥ minCluster 的群(每個 base 符號各自 flood-fill,wild 替代)。
 * @returns {{symbolId: string, size: number, cells: [number, number][]}[]}
 */
function findClusters(board, reels, rows, minCluster, isWild, isScatter) {
  const result = [];
  // 收集場上出現過的 base 符號
  const bases = new Set();
  for (let r = 0; r < reels; r++) {
    for (let row = 0; row < rows; row++) {
      const id = board[r][row];
      if (!isWild(id) && !isScatter(id)) bases.add(id);
    }
  }

  for (const base of bases) {
    const seen = Array.from({ length: reels }, () => new Array(rows).fill(false));
    for (let r = 0; r < reels; r++) {
      for (let row = 0; row < rows; row++) {
        if (seen[r][row]) continue;
        const cell = board[r][row];
        if (cell !== base && !isWild(cell)) continue;
        // BFS：cell==base 或 wild
        const cells = [];
        let hasBase = false;
        const stack = [[r, row]];
        seen[r][row] = true;
        while (stack.length) {
          const [cr, crow] = stack.pop();
          const v = board[cr][crow];
          if (v === base) hasBase = true;
          cells.push([cr, crow]);
          const nb = [
            [cr - 1, crow],
            [cr + 1, crow],
            [cr, crow - 1],
            [cr, crow + 1],
          ];
          for (const [nr, nrow] of nb) {
            if (nr < 0 || nr >= reels || nrow < 0 || nrow >= rows) continue;
            if (seen[nr][nrow]) continue;
            const nv = board[nr][nrow];
            if (nv === base || isWild(nv)) {
              seen[nr][nrow] = true;
              stack.push([nr, nrow]);
            }
          }
        }
        if (hasBase && cells.length >= minCluster) {
          result.push({ symbolId: base, size: cells.length, cells });
        }
      }
    }
  }
  return result;
}

/** 取 pay 中「鍵 ≤ size」的最大鍵對應賠率(門檻制);無則 0 */
function clusterPay(sym, size) {
  if (!sym?.pay) return 0;
  let bestKey = -1;
  let bestPay = 0;
  for (const [k, v] of Object.entries(sym.pay)) {
    const n = Number(k);
    if (n <= size && n > bestKey) {
      bestKey = n;
      bestPay = v;
    }
  }
  return bestPay;
}

/** 消除 removed,存活下落,頂端由轉軸帶補新。回傳新盤面(每軸 [新...,存活...]) */
function collapseRefill(board, removed, cfg, rand) {
  const removedSet = new Set(removed.map(([r, row]) => r + ',' + row));
  /** @type {import('../types').Board} */
  const newBoard = [];
  for (let r = 0; r < cfg.grid.reels; r++) {
    const kept = [];
    for (let row = 0; row < cfg.grid.rows; row++) {
      if (!removedSet.has(r + ',' + row)) kept.push(board[r][row]);
    }
    const need = cfg.grid.rows - kept.length;
    const strip = cfg.reelStrips[r] ?? cfg.reelStrips[0];
    const fresh = [];
    for (let i = 0; i < need; i++) fresh.push(strip[randInt(rand, strip.length)]);
    newBoard.push([...fresh, ...kept]);
  }
  return newBoard;
}
