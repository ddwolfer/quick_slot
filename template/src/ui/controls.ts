import type { GameConfig } from '../core/types';

/**
 * HTML overlay 控制列：餘額、押注加減、SPIN、賠付表。
 * 純 DOM，不進 PixiJS 場景（modal / 按鈕用 HTML 最省事）。
 */
export class Controls {
  balance: number;
  bet: number;
  private levels: number[];
  private idx: number;
  private elBalance: HTMLElement;
  private elBet: HTMLElement;
  private spinBtn: HTMLButtonElement;
  private onSpin: () => void;

  constructor(cfg: GameConfig, opts: { balance: number; onSpin: () => void }) {
    this.balance = opts.balance;
    this.onSpin = opts.onSpin;
    this.levels = cfg.bet.levels;
    this.idx = Math.max(0, this.levels.indexOf(cfg.bet.default));
    this.bet = this.levels[this.idx];

    this.elBalance = document.getElementById('balance')!;
    this.elBet = document.getElementById('bet')!;
    this.spinBtn = document.getElementById('spin') as HTMLButtonElement;

    (document.getElementById('bet-dec') as HTMLButtonElement).onclick = () => this.changeBet(-1);
    (document.getElementById('bet-inc') as HTMLButtonElement).onclick = () => this.changeBet(1);
    this.spinBtn.onclick = () => this.onSpin();

    this.buildPaytable(cfg);
    this.refresh();
  }

  private changeBet(d: number) {
    this.idx = Math.min(this.levels.length - 1, Math.max(0, this.idx + d));
    this.bet = this.levels[this.idx];
    this.refresh();
  }

  refresh() {
    this.elBalance.textContent = this.balance.toFixed(2);
    this.elBet.textContent = this.bet.toFixed(2);
  }

  setEnabled(b: boolean) {
    this.spinBtn.disabled = !b;
    this.spinBtn.classList.toggle('disabled', !b);
  }

  flashInsufficient() {
    this.elBalance.classList.add('flash');
    setTimeout(() => this.elBalance.classList.remove('flash'), 500);
  }

  private buildPaytable(cfg: GameConfig) {
    const content = document.getElementById('paytable-content')!;
    content.innerHTML = cfg.symbols
      .map((s) => {
        const pays = s.pay
          ? Object.entries(s.pay)
              .map(([k, v]) => `${k}× = ${v}`)
              .join(' · ')
          : '替代符號（wild）';
        return `<div class="pt-row"><b>${s.label ?? s.id}</b><span class="pt-kind">${s.kind}</span><span class="pt-pay">${pays}</span></div>`;
      })
      .join('');

    const modal = document.getElementById('paytable-modal')!;
    (document.getElementById('paytable-btn') as HTMLButtonElement).onclick = () =>
      modal.classList.remove('hidden');
    (document.getElementById('paytable-close') as HTMLButtonElement).onclick = () =>
      modal.classList.add('hidden');
  }
}
