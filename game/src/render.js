// The Velvet Vault — everything the player sees.
// One job: draw the room, the cones, the people, the loot and the HUD.

import { VIEW_W, VIEW_H, WALL, COLORS, ALARM_MAX, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE, CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE } from './config.js';
import { OBSTACLES, LOOT_SPOTS, EXIT } from './level.js';

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Checker tiles so movement reads at a glance.
  ctx.fillStyle = COLORS.floorTile;
  const tile = 64;
  for (let y = WALL; y < VIEW_H - WALL; y += tile) {
    for (let x = WALL; x < VIEW_W - WALL; x += tile) {
      if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) ctx.fillRect(x, y, tile, tile);
    }
  }
  // The red carpet runs from the door to the vault: the thief's route.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(60, 330, 1130, 50);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 330, 1130, 50);
  // Walls.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, WALL);
  ctx.fillRect(0, VIEW_H - WALL, VIEW_W, WALL);
  ctx.fillRect(0, 0, WALL, VIEW_H);
  ctx.fillRect(VIEW_W - WALL, 0, WALL, VIEW_H);
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(WALL, WALL, VIEW_W - WALL * 2, VIEW_H - WALL * 2);
}

function drawObstacle(ctx, o) {
  let top = COLORS.coverWoodTop;
  let side = COLORS.coverWood;
  if (o.kind === 'crate') { top = COLORS.coverMetalTop; side = COLORS.coverMetal; }
  if (o.kind === 'case') { top = '#7d8aa5'; side = '#525f78'; }
  if (o.kind === 'safe') { top = '#5a6274'; side = '#3c4356'; }
  if (o.kind === 'plant') { top = COLORS.coverPlantTop; side = COLORS.coverPlant; }
  ctx.fillStyle = side;
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = top;
  ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(o.x, o.y, o.w, o.h);
  if (o.kind === 'crate') {
    ctx.beginPath();
    ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.moveTo(o.x + o.w, o.y); ctx.lineTo(o.x, o.y + o.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.stroke();
  }
  if (o.kind === 'safe') {
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#c9cedb';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#3c4356';
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 4);
}

function drawExit(ctx, diamondTaken) {
  ctx.fillStyle = diamondTaken ? COLORS.exit : '#2c7a52';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#b8ffdd';
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(diamondTaken ? 'EXIT — GO!' : 'EXIT', 0, 4);
  ctx.restore();
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const spot = LOOT_SPOTS.find((s) => s.id === item.id);
    const bob = Math.sin(time * 2 + spot.x) * 3;
    const x = spot.x;
    const y = spot.y + bob;
    // Glow ring so loot is obvious at a glance.
    ctx.beginPath();
    ctx.arc(x, y, 26 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (spot.kind === 'diamond') {
      ctx.fillStyle = COLORS.lootDiamond;
      ctx.beginPath();
      ctx.moveTo(x, y - 18); ctx.lineTo(x + 16, y - 2); ctx.lineTo(x, y + 16); ctx.lineTo(x - 16, y - 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(x, y - 18); ctx.lineTo(x + 16, y - 2); ctx.lineTo(x - 16, y - 2);
      ctx.closePath(); ctx.fill();
    } else if (spot.kind === 'gold') {
      ctx.fillStyle = COLORS.lootGold;
      for (let i = 0; i < 3; i++) ctx.fillRect(x - 18 + i * 12, y - 6 + (i % 2) * 8, 14, 10);
    } else if (spot.kind === 'cash') {
      ctx.fillStyle = COLORS.lootCash;
      ctx.fillRect(x - 18, y - 10, 36, 20);
      ctx.fillStyle = '#2c5a2c';
      ctx.fillRect(x - 6, y - 6, 12, 12);
    } else {
      ctx.fillStyle = COLORS.lootGem;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(spot.name, x, y + 34);
  }
}

function drawGuard(ctx, g) {
  drawCone(ctx, g.x, g.y, g.angle, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
    g.state === 'chase' ? COLORS.coneGuardAlert : COLORS.coneGuard);
  // Body.
  ctx.beginPath();
  ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.guardSuit;
  ctx.fill();
  ctx.strokeStyle = COLORS.guard;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Face direction tick.
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
  ctx.strokeStyle = '#ffd9d9';
  ctx.lineWidth = 3;
  ctx.stroke();
  // State badge.
  ctx.fillStyle = g.state === 'chase' ? '#ff4d4d' : g.state === 'suspicious' ? '#f2c14e' : '#8a93ad';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.textAlign = 'center';
  const label = g.state === 'chase' ? '!' : g.state === 'suspicious' ? '?' : '';
  if (label) ctx.fillText(label, g.x, g.y - 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Verdana, sans-serif';
  ctx.fillText('GUARD', g.x, g.y + 28);
}

function drawCamera(ctx, c) {
  drawCone(ctx, c.x, c.y, c.angle, CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE, COLORS.coneCamera);
  ctx.fillStyle = COLORS.camera;
  ctx.fillRect(c.x - 10, c.y - 7, 20, 14);
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 14, c.y + Math.sin(c.angle) * 14, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#222233';
  ctx.fill();
  // Blinking red recording light.
  if (Math.floor(c.blink * 2) % 2 === 0) {
    ctx.beginPath();
    ctx.arc(c.x - 12, c.y - 10, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2d2d';
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAM', c.x, c.y + 26);
}

function drawThief(ctx, thief, time) {
  // Click-to-move target marker.
  if (thief.target) {
    ctx.beginPath();
    ctx.arc(thief.target.x, thief.target.y, 8 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(242,208,107,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.thiefCoat;
  ctx.fill();
  ctx.strokeStyle = COLORS.thief;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Mask + hat brim.
  ctx.fillStyle = COLORS.thief;
  ctx.fillRect(thief.x - 9, thief.y - 3, 18, 5);
  ctx.beginPath();
  ctx.arc(thief.x, thief.y - 6, 7, Math.PI, 0);
  ctx.fillStyle = '#1d1d2b';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', thief.x, thief.y + 27);
}

function drawSmoke(ctx, smokes) {
  for (const s of smokes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.smoke;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a3a4a';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMOKE', s.x, s.y + 4);
  }
}

function drawCoin(ctx, coin) {
  if (!coin) return;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe27a';
  ctx.fill();
  ctx.strokeStyle = '#a8842a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#3a3a4a';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLINK!', coin.x, coin.y - 13);
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, 54);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET VAULT', 16, 22);
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText('Grab the diamond, then reach the green EXIT', 16, 40);

  // Loot count.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LOOT ${game.lootTaken}/${game.lootTotal}  ·  SCORE ${game.score}`, 430, 22);
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText(game.diamondTaken ? 'Diamond secured — get out!' : 'The Velvet Diamond is the prize', 430, 40);

  // Alarm meter.
  const ax = 760;
  const aw = 220;
  ctx.fillStyle = '#11101e';
  ctx.fillRect(ax, 12, aw, 16);
  const frac = game.alarm / ALARM_MAX;
  ctx.fillStyle = frac < 0.4 ? COLORS.alarmLow : frac < 0.7 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillRect(ax, 12, aw * frac, 16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 12, aw, 16);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(game.alarm)}`, ax, 44);

  // Timer + tools.
  const mm = String(Math.floor(game.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${mm}:${ss}`, 1264, 22);
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText(`Smoke Q ×${game.smokeLeft}   Coin E ×${game.coinLeft}`, 1264, 40);
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 6, 16, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 300);
  ctx.fillStyle = '#efeaf7';
  ctx.font = '17px Verdana, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 350 + i * 30));
  ctx.fillStyle = '#a89fc7';
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText('Press R to play again', VIEW_W / 2, 350 + lines.length * 30 + 18);
}

export function render(ctx, game) {
  drawFloor(ctx);
  drawExit(ctx, game.diamondTaken);
  drawLoot(ctx, game.loot, game.time);
  for (const o of OBSTACLES) drawObstacle(ctx, o);
  for (const c of game.cameras) drawCamera(ctx, c);
  for (const g of game.guards) drawGuard(ctx, g);
  drawCoin(ctx, game.coin);
  drawSmoke(ctx, game.smokes);
  if (game.state === 'playing' || game.state === 'won' || game.state === 'lost') {
    drawThief(ctx, game.thief, game.time);
  }
  drawHud(ctx, game);

  if (game.state === 'title') {
    drawOverlay(ctx, 'THE VELVET VAULT', [
      'One thief. One diamond. Three guards and three cameras.',
      'Stay out of the yellow cones, hide behind desks and crates,',
      'grab the Velvet Diamond and slip out the green EXIT door.',
      'WASD / arrows or click to move · Q smoke · E coin toss',
    ], '#f2d06b');
    ctx.fillStyle = '#a89fc7';
    ctx.font = '14px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click or press any key to begin', VIEW_W / 2, 560);
  } else if (game.state === 'won') {
    drawOverlay(ctx, 'CLEAN GETAWAY!', [
      `You escaped with ${game.lootTaken} loot piles and ${game.score} points`,
      `in ${Math.floor(game.time / 60)}:${String(Math.floor(game.time % 60)).padStart(2, '0')} — the Velvet Diamond is yours.`,
    ], '#39d98a');
  } else if (game.state === 'lost') {
    drawOverlay(ctx, 'CAUGHT!', [
      game.loseReason || 'The alarm hit 100 and the guards closed in.',
      `You had ${game.lootTaken} loot piles and ${game.score} points.`,
    ], '#ff4d4d');
  }
}
