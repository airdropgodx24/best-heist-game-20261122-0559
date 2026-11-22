// The Velvet Vault — game state, the loop, tools, win and lose.
// One job: own the state machine and drive guards, cameras, alarm and loot.

import {
  VIEW_W, VIEW_H, THIEF_SPEED, THIEF_RADIUS, ALARM_GUARD_RATE,
  ALARM_CAMERA_RATE, ALARM_CHASE_RATE, ALARM_DECAY_RATE, ALARM_MAX,
  SMOKE_START, SMOKE_RADIUS, SMOKE_SECONDS, COIN_START, COIN_LURE_SECONDS,
} from './config.js';
import { LOOT_SPOTS, THIEF_START, inExit, moveCircle } from './level.js';
import { createInput } from './input.js';
import { createGuards } from './guards.js';
import { createCameras } from './cameras.js';
import { createAudio } from './audio.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene') || '';
// ?still=1 freezes the simulation after the scene is placed, so a
// screenshot always catches the exact staged moment.
const still = params.has('still');

function freshLoot() {
  return LOOT_SPOTS.map((s) => ({ id: s.id, taken: false }));
}

function createGame() {
  return {
    state: 'title', // title | playing | won | lost
    time: 0,
    alarm: 0,
    score: 0,
    loot: freshLoot(),
    lootTaken: 0,
    lootTotal: LOOT_SPOTS.length,
    diamondTaken: false,
    guards: createGuards(),
    cameras: createCameras(),
    thief: { x: THIEF_START.x, y: THIEF_START.y, target: null, angle: 0 },
    smokes: [],
    coin: null,
    smokeLeft: SMOKE_START,
    coinLeft: COIN_START,
    loseReason: '',
    tickTimer: 0,
    wasSeen: false,
  };
}

let game = createGame();

// Screenshot scenes: deterministic starting states so each shot shows a
// different honest moment of the same game, rendered by its own code.
function applyScene() {
  if (!scene) return;
  game.state = 'playing';
  if (scene === 'patrol') {
    game.thief.x = 560; game.thief.y = 355;
    game.alarm = 15; game.time = 42;
  } else if (scene === 'spotted') {
    game.thief.x = 700; game.thief.y = 205;
    game.thief.target = null;
    game.alarm = 62; game.time = 95;
    game.guards[0].x = 620; game.guards[0].y = 205;
    game.guards[0].state = 'chase';
    game.guards[0].lastSeen = { x: 700, y: 205 };
    game.guards[0].angle = 0;
  } else if (scene === 'loot') {
    game.thief.x = 1060; game.thief.y = 200;
    game.alarm = 30; game.time = 150;
    game.score = 450;
    for (const item of game.loot) {
      if (item.id === 'gold' || item.id === 'cash') item.taken = true;
    }
    game.lootTaken = 2;
    game.guards[1].x = 980; game.guards[1].y = 330;
    game.guards[1].state = 'suspicious';
    game.guards[1].pauseTimer = 1.4;
  } else if (scene === 'smoke') {
    game.thief.x = 640; game.thief.y = 300;
    game.alarm = 48; game.time = 120;
    game.smokes.push({ x: 640, y: 300, r: SMOKE_RADIUS, t: SMOKE_SECONDS });
    game.smokeLeft = 1;
  }
}

function restart() {
  game = createGame();
  game.state = 'playing';
  applyScene();
}

function nearestLootInReach() {
  for (const item of game.loot) {
    if (item.taken) continue;
    const spot = LOOT_SPOTS.find((s) => s.id === item.id);
    if (Math.hypot(spot.x - game.thief.x, spot.y - game.thief.y) < 34) return { item, spot };
  }
  return null;
}

function update(dt) {
  if (game.state !== 'playing') return;
  game.time += dt;

  // --- Thief movement: keys, else click-to-move. ---
  const t = game.thief;
  let mx = input.moveX;
  let my = input.moveY;
  if (mx === 0 && my === 0 && input.target) {
    t.target = input.target;
    const dx = input.target.x - t.x;
    const dy = input.target.y - t.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      input.target = null;
      t.target = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  } else {
    t.target = input.target;
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const step = THIEF_SPEED * dt;
    moveCircle(t, (mx / len) * step, (my / len) * step, THIEF_RADIUS);
    t.angle = Math.atan2(my, mx);
  }

  // --- Tools. ---
  if (input.consumeSmoke() && game.smokeLeft > 0) {
    game.smokes.push({ x: t.x, y: t.y, r: SMOKE_RADIUS, t: SMOKE_SECONDS });
    game.smokeLeft -= 1;
    audio.smoke();
  }
  if (input.consumeCoin() && game.coinLeft > 0 && !game.coin) {
    const cx = t.x + Math.cos(t.angle || 0) * 130;
    const cy = t.y + Math.sin(t.angle || 0) * 130;
    game.coin = {
      x: Math.max(50, Math.min(VIEW_W - 50, cx)),
      y: Math.max(50, Math.min(VIEW_H - 50, cy)),
      t: COIN_LURE_SECONDS,
    };
    game.coinLeft -= 1;
    audio.coin();
    // The nearest guard goes to investigate the clink.
    let best = null;
    let bestD = Infinity;
    for (const g of game.guards) {
      const d = Math.hypot(g.x - game.coin.x, g.y - game.coin.y);
      if (d < bestD) { bestD = d; best = g; }
    }
    if (best && bestD < 420 && best.state !== 'chase') {
      best.lure = { x: game.coin.x, y: game.coin.y };
      best.state = 'patrol';
    }
  }
  for (const s of game.smokes) s.t -= dt;
  game.smokes = game.smokes.filter((s) => s.t > 0);
  if (game.coin) {
    game.coin.t -= dt;
    if (game.coin.t <= 0) {
      game.coin = null;
      for (const g of game.guards) g.lure = null;
    }
  }

  // --- Guards and cameras. ---
  for (const g of game.guards) g.update(dt, t, game.smokes);
  for (const c of game.cameras) c.update(dt, t, game.smokes);

  // --- Alarm. ---
  const seenByGuard = game.guards.some((g) => g.seesThief);
  const seenByCamera = game.cameras.some((c) => c.seesThief);
  const chasing = game.guards.some((g) => g.state === 'chase');
  if (seenByGuard) game.alarm += ALARM_GUARD_RATE * dt;
  if (seenByCamera) game.alarm += ALARM_CAMERA_RATE * dt;
  if (chasing) game.alarm += ALARM_CHASE_RATE * dt;
  if (!seenByGuard && !seenByCamera && !chasing) {
    game.alarm = Math.max(0, game.alarm - ALARM_DECAY_RATE * dt);
  }
  game.alarm = Math.min(ALARM_MAX, game.alarm);

  const seenNow = seenByGuard || seenByCamera;
  if (seenNow && !game.wasSeen) audio.spotted();
  game.wasSeen = seenNow;
  if (seenNow) {
    game.tickTimer -= dt;
    if (game.tickTimer <= 0) {
      audio.alarmTick();
      game.tickTimer = 0.5;
    }
  }

  // --- Caught by touch. ---
  for (const g of game.guards) {
    if (Math.hypot(g.x - t.x, g.y - t.y) < 26) {
      game.state = 'lost';
      game.loseReason = 'A guard grabbed you in the gallery.';
      audio.lose();
      return;
    }
  }

  // --- Loot. ---
  const grab = nearestLootInReach();
  if (grab) {
    grab.item.taken = true;
    game.lootTaken += 1;
    game.score += grab.spot.score;
    if (grab.item.id === 'diamond') game.diamondTaken = true;
    audio.pickup();
  }

  // --- Win / lose. ---
  if (game.diamondTaken && inExit(t.x, t.y)) {
    game.state = 'won';
    game.score += 500; // clean-getaway bonus
    audio.win();
    return;
  }
  if (game.alarm >= ALARM_MAX) {
    game.state = 'lost';
    game.loseReason = 'The alarm hit 100 and the guards closed in.';
    audio.lose();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (still && game.state === 'playing') {
    // Frozen frame: render the staged scene exactly as placed.
  } else if (game.state === 'title') {
    // Any key or click starts the heist.
    if (input.consumeAnyKey() || input.target) {
      input.target = null;
      audio.unlock();
      game.state = 'playing';
      applyScene();
    }
    // Patrols drift behind the title so the room feels alive.
    for (const g of game.guards) g.update(dt, game.thief, game.smokes);
    for (const c of game.cameras) c.update(dt, game.thief, game.smokes);
  } else {
    if (input.consumeAnyKey()) audio.unlock();
    update(dt);
  }

  render(ctx, game);
  requestAnimationFrame(frame);
}

// R restarts from the win/lose screens (and mid-game). Registered once.
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && game.state !== 'title') restart();
});

// Scene screenshots skip the title screen entirely.
applyScene();
requestAnimationFrame(frame);
