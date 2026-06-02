import type { Ticker } from 'pixi.js';
import type { GameEvent } from '../core/types';
import type { Reels } from './reels';
import type { WinPresenter } from './winPresenter';
import type { TumbleLayer } from './TumbleLayer';

/**
 * 把 Event 串流逐一播成動畫。每步都 await —— 不 fire-and-forget，避免 round 卡住。
 * 玩法升級（tumble）時，只要在此加一個 case，核心與 payline 不受影響。
 * tumbleLayer 為選配：payline/ways 不會發 'tumble' event，可不傳。
 */
export async function playEvents(
  events: GameEvent[],
  reels: Reels,
  presenter: WinPresenter,
  ticker: Ticker,
  tumbleLayer?: TumbleLayer
): Promise<void> {
  for (const e of events) {
    switch (e.type) {
      case 'reveal':
        await reels.spin(ticker, e.board);
        break;
      case 'win':
        await presenter.showWin(e);
        break;
      case 'scatterWin':
        await presenter.showScatter(e);
        break;
      case 'tumble':
        if (tumbleLayer) await tumbleLayer.play(e, reels);
        else await reels.tumble(e.removed, e.board, ticker); // 無 FX 也要更新盤面
        break;
      case 'totalWin':
        await presenter.showTotal(e.amount);
        break;
    }
  }
}
