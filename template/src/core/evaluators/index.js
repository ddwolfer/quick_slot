// 依 mechanic 選 evaluator。新增玩法時在此註冊。
import { evaluatePaylines } from './payline.js';
import { evaluateWays } from './ways.js';
import { evaluateCluster } from './cluster.js';

/**
 * @param {import('../types').Mechanic} mechanic
 * @returns {import('../types').Evaluator}
 */
export function getEvaluator(mechanic) {
  switch (mechanic) {
    case 'payline':
      return evaluatePaylines;
    case 'ways':
      return evaluateWays;
    case 'cluster':
      return evaluateCluster;
    default:
      throw new Error('unknown mechanic: ' + mechanic);
  }
}
