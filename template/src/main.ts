import { Application, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import rawConfig from '../game.config.json';
import type { GameConfig, Board } from './core/types';
import { spin, drawBoard } from './core/engine.js';
import { makeRng } from './core/rng.js';
import { loadGameAssets } from './assets/manifest';
import { setSymbolTextures } from './render/symbols';
import { Reels } from './render/reels';
import { WinPresenter } from './render/winPresenter';
import { TumbleLayer } from './render/TumbleLayer';
import { playEvents } from './render/eventPlayer';
import { Controls } from './ui/controls';

const config = rawConfig as unknown as GameConfig;

const GAME_W = 1280;
const GAME_H = 720;
const CELL = 120;

function fitCanvas(canvas: HTMLCanvasElement) {
  const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  canvas.style.width = `${Math.floor(GAME_W * scale)}px`;
  canvas.style.height = `${Math.floor(GAME_H * scale)}px`;
}

async function main() {
  const app = new Application();
  await app.init({ width: GAME_W, height: GAME_H, background: 0x10131c, antialias: true });

  const root = document.getElementById('game-root')!;
  root.appendChild(app.canvas);
  fitCanvas(app.canvas);
  window.addEventListener('resize', () => fitCanvas(app.canvas));

  // 預載美術(有 public/assets/manifest.json 才載;沒有就 placeholder 模式,零 404)
  const assets = await loadGameAssets(config);
  setSymbolTextures(assets.symbols);

  const reelsW = config.grid.reels * CELL;
  const reelsH = config.grid.rows * CELL;
  const frameX = GAME_W / 2 - reelsW / 2;
  const frameY = GAME_H / 2 - reelsH / 2;

  // 背景:有美術用 Sprite 鋪滿,否則 placeholder 純色
  if (assets.background) {
    const bgSprite = new Sprite(assets.background);
    bgSprite.width = GAME_W;
    bgSprite.height = GAME_H;
    app.stage.addChild(bgSprite);
  } else {
    const bgFill = new Graphics();
    bgFill.rect(0, 0, GAME_W, GAME_H).fill(0x10131c);
    app.stage.addChild(bgFill);
  }

  // 盤面框(無論有無美術都留,框住轉軸區)
  const frame = new Graphics();
  frame
    .roundRect(frameX - 24, frameY - 24, reelsW + 48, reelsH + 48, 20)
    .fill({ color: 0x1b2030, alpha: assets.background ? 0.55 : 1 })
    .stroke({ width: 4, color: 0x2c3450 });
  app.stage.addChild(frame);

  // 標題:有 logo 美術用 Sprite,否則文字
  if (assets.logo) {
    const logo = new Sprite(assets.logo);
    const maxW = reelsW + 48;
    const k = Math.min(maxW / assets.logo.width, 120 / assets.logo.height);
    logo.width = assets.logo.width * k;
    logo.height = assets.logo.height * k;
    logo.anchor.set(0.5, 0);
    logo.x = GAME_W / 2;
    logo.y = 16;
    app.stage.addChild(logo);
  } else {
    const title = new Text({
      text: config.theme.toUpperCase(),
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 44, fontWeight: '900', fill: 0xffe14d }),
    });
    title.anchor.set(0.5, 0);
    title.x = GAME_W / 2;
    title.y = 44;
    app.stage.addChild(title);
  }

  // 初始盤面
  const rng = makeRng();
  const initial = drawBoard(config, rng) as Board;

  const reels = new Reels(config, CELL, initial);
  reels.container.x = frameX;
  reels.container.y = frameY;
  app.stage.addChild(reels.container);

  const presenter = new WinPresenter(config, CELL, app.ticker);
  presenter.overlay.x = frameX;
  presenter.overlay.y = frameY;
  app.stage.addChild(presenter.overlay);

  // 可插拔的 cluster/tumble 呈現層（payline/ways 模式下完全 dormant）
  const tumbleLayer = new TumbleLayer(CELL, app.ticker);
  tumbleLayer.overlay.x = frameX;
  tumbleLayer.overlay.y = frameY;
  app.stage.addChild(tumbleLayer.overlay);

  const winText = presenter.getWinText();
  winText.x = GAME_W / 2;
  winText.y = frameY + reelsH / 2;
  app.stage.addChild(winText);

  let spinning = false;
  const controls = new Controls(config, { balance: 1000, onSpin: doSpin });

  async function doSpin() {
    if (spinning) return;
    if (controls.balance < controls.bet) {
      controls.flashInsufficient();
      return;
    }
    spinning = true;
    controls.setEnabled(false);
    controls.balance -= controls.bet;
    controls.refresh();

    const result = spin(config, rng, controls.bet);
    await playEvents(result.events, reels, presenter, app.ticker, tumbleLayer);

    controls.balance += result.totalWin;
    controls.refresh();
    spinning = false;
    controls.setEnabled(true);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      doSpin();
    }
  });
}

main();
