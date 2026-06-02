// 依 mechanic 選 evaluator。新增玩法時在此註冊。
import { evaluatePaylines } from './payline.js';

/**
 * @param {import('../types').Mechanic} mechanic
 * @returns {import('../types').Evaluator}
 */
export function getEvaluator(mechanic) {
  switch (mechanic) {
    case 'payline':
      return evaluatePaylines;
    case 'ways':
      throw new Error('ways evaluator 尚未實作（M3 升級項）');
    case 'cluster':
      throw new Error('cluster evaluator 尚未實作（M3 升級項，含 tumble）');
    default:
      throw new Error('unknown mechanic: ' + mechanic);
  }
}
