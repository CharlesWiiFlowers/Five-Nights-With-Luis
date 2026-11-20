import Phaser from 'phaser';
import 'katex/dist/katex.min.css';
import './ui/styles.css';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { SectorScene } from './scenes/SectorScene.js';
import { PlannerScene } from './scenes/PlannerScene.js';
import { ConsoleScene } from './scenes/ConsoleScene.js';
import { ExplainScene } from './scenes/ExplainScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';

export const WIDTH = 1280;
export const HEIGHT = 720;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#04050c',
  dom: { createContainer: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, SectorScene, PlannerScene, ConsoleScene, ExplainScene, TransitionScene, PauseScene, VictoryScene],
});

if (new URLSearchParams(location.search).has('debug')) window.__od = game;
