// The Velvet Vault — the patrolling guards.
// One job: walk waypoints, look with a visible cone, and chase what they see.

import {
  GUARD_SPEED_PATROL,
  GUARD_SPEED_CHASE,
  GUARD_VIEW_RANGE,
  GUARD_VIEW_HALF_ANGLE,
} from './config.js';
import { lineBlocked, moveCircle } from './level.js';

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the thief right now? Range, cone, line of sight,
// and not through a smoke cloud.
export function guardCanSee(guard, tx, ty, smokes) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VIEW_RANGE) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.angle)) > GUARD_VIEW_HALF_ANGLE) return false;
  if (lineBlocked(guard.x, guard.y, tx, ty)) return false;
  for (const s of smokes) {
    if (Math.hypot(tx - s.x, ty - s.y) < s.r || Math.hypot(guard.x - s.x, guard.y - s.y) < s.r) return false;
    // A smoke cloud between watcher and thief also blocks the view.
    const segLen = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(segLen / 8));
    for (let i = 1; i < steps; i++) {
      const px = guard.x + (dx * i) / steps;
      const py = guard.y + (dy * i) / steps;
      if (Math.hypot(px - s.x, py - s.y) < s.r) return false;
    }
  }
  return true;
}

export class Guard {
  constructor(waypoints, startIndex = 0) {
    this.waypoints = waypoints;
    this.wp = startIndex;
    this.x = waypoints[startIndex].x;
    this.y = waypoints[startIndex].y;
    const next = waypoints[(startIndex + 1) % waypoints.length];
    this.angle = Math.atan2(next.y - this.y, next.x - this.x);
    this.state = 'patrol'; // patrol | suspicious | chase
    this.pauseTimer = 0;
    this.lastSeen = null; // {x, y} of the thief's last spotted position
    this.loseTimer = 0;
    this.lure = null; // {x, y, t} coin distraction target
    this.seesThief = false;
  }

  update(dt, thief, smokes) {
    this.seesThief = guardCanSee(this, thief.x, thief.y, smokes);
    if (this.seesThief) {
      this.lastSeen = { x: thief.x, y: thief.y };
      this.loseTimer = 0;
      if (this.state !== 'chase') this.state = 'chase';
    }

    if (this.state === 'chase') {
      if (!this.seesThief) {
        this.loseTimer += dt;
        if (this.loseTimer > 3) {
          this.state = 'patrol';
          this.lastSeen = null;
        }
      }
      const target = this.lastSeen || this.waypoints[this.wp];
      this.walkToward(target.x, target.y, GUARD_SPEED_CHASE, dt);
      if (this.lastSeen && Math.hypot(target.x - this.x, target.y - this.y) < 18 && !this.seesThief) {
        this.state = 'suspicious';
        this.pauseTimer = 1.6;
      }
      return;
    }

    if (this.state === 'suspicious') {
      this.pauseTimer -= dt;
      if (this.lastSeen) this.angle = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
      if (this.pauseTimer <= 0) this.state = 'patrol';
      return;
    }

    // Patrol: walk the waypoint loop, pausing briefly at each corner.
    if (this.lure) {
      this.walkToward(this.lure.x, this.lure.y, GUARD_SPEED_PATROL, dt);
      if (Math.hypot(this.lure.x - this.x, this.lure.y - this.y) < 20) this.lure = null;
      return;
    }
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }
    const wp = this.waypoints[this.wp];
    const d = Math.hypot(wp.x - this.x, wp.y - this.y);
    if (d < 10) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.pauseTimer = 0.9;
      return;
    }
    this.walkToward(wp.x, wp.y, GUARD_SPEED_PATROL, dt);
  }

  walkToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    this.angle = Math.atan2(dy, dx);
    const step = Math.min(d, speed * dt);
    moveCircle(this, (dx / d) * step, (dy / d) * step, 15);
  }
}

export function createGuards() {
  return [
    new Guard([{ x: 330, y: 205 }, { x: 880, y: 205 }, { x: 880, y: 320 }, { x: 330, y: 320 }], 0),
    new Guard([{ x: 980, y: 190 }, { x: 980, y: 520 }, { x: 1150, y: 520 }, { x: 1150, y: 190 }], 1),
    new Guard([{ x: 300, y: 560 }, { x: 850, y: 560 }, { x: 850, y: 660 }, { x: 300, y: 660 }], 2),
  ];
}
