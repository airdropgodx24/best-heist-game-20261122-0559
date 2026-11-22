// The Velvet Vault — the room: walls, cover, loot, exit, and vision blocking.
// One job: describe the gallery floor and answer "does this line of sight hit cover?"

import { VIEW_W, VIEW_H, WALL } from './config.js';

// Cover pieces the thief hides behind. kind drives the colour in render.js.
export const OBSTACLES = [
  { x: 170, y: 130, w: 190, h: 70, kind: 'desk', label: 'Desk' },
  { x: 520, y: 110, w: 95, h: 95, kind: 'crate', label: 'Crates' },
  { x: 820, y: 105, w: 210, h: 60, kind: 'case', label: 'Display case' },
  { x: 1050, y: 290, w: 95, h: 115, kind: 'safe', label: 'Safe' },
  { x: 190, y: 420, w: 205, h: 70, kind: 'desk', label: 'Desk' },
  { x: 560, y: 430, w: 105, h: 105, kind: 'crate', label: 'Crates' },
  { x: 900, y: 480, w: 85, h: 85, kind: 'plant', label: 'Palm' },
  { x: 470, y: 270, w: 230, h: 60, kind: 'case', label: 'Vault counter' },
  { x: 330, y: 590, w: 150, h: 55, kind: 'plant', label: 'Fern' },
];

// Loot piles. The diamond is the prize; the rest are bonus scores.
export const LOOT_SPOTS = [
  { id: 'diamond', x: 1095, y: 180, kind: 'diamond', name: 'Velvet Diamond', score: 500 },
  { id: 'gold', x: 290, y: 565, kind: 'gold', name: 'Gold bars', score: 200 },
  { id: 'cash', x: 700, y: 615, kind: 'cash', name: 'Cash stack', score: 150 },
  { id: 'emerald', x: 640, y: 155, kind: 'gem', name: 'Emerald brooch', score: 250 },
];

// The green exit door on the left wall. Reach it with the diamond to win.
export const EXIT = { x: WALL, y: 300, w: 26, h: 110 };

// Thief starting spot, just inside the exit door.
export const THIEF_START = { x: 105, y: 355 };

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Sample the segment: cheap, robust, and good enough at our scale.
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInRect(x1 + dx * t, y1 + dy * t, r)) return true;
  }
  return false;
}

// True when a wall or a cover piece stands between two points.
export function lineBlocked(x1, y1, x2, y2) {
  for (const o of OBSTACLES) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return true;
  }
  return false;
}

// True when a point lies inside the outer walls (not inside the room).
export function hitsWall(px, py, radius) {
  return (
    px - radius < WALL ||
    px + radius > VIEW_W - WALL ||
    py - radius < WALL ||
    py + radius > VIEW_H - WALL
  );
}

// True when a circle overlaps any cover piece.
export function hitsObstacle(px, py, radius) {
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x, Math.min(px, o.x + o.w));
    const cy = Math.max(o.y, Math.min(py, o.y + o.h));
    if (Math.hypot(px - cx, py - cy) < radius) return true;
  }
  return false;
}

// Move a circle, sliding along walls and cover instead of sticking.
export function moveCircle(pos, dx, dy, radius) {
  const nx = pos.x + dx;
  if (!hitsWall(nx, pos.y, radius) && !hitsObstacle(nx, pos.y, radius)) pos.x = nx;
  const ny = pos.y + dy;
  if (!hitsWall(pos.x, ny, radius) && !hitsObstacle(pos.x, ny, radius)) pos.y = ny;
}

// Is the thief standing in the exit doorway?
export function inExit(px, py) {
  return px < EXIT.x + EXIT.w + 14 && py > EXIT.y - 6 && py < EXIT.y + EXIT.h + 6;
}
