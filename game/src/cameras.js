// The Velvet Vault — the wall-mounted security cameras.
// One job: sweep a visible cone back and forth and report when it sees the thief.

import { CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE } from './config.js';
import { lineBlocked } from './level.js';
import { angleDiff } from './guards.js';

export class Camera {
  constructor(x, y, baseAngle, sweep, speed, phase = 0) {
    this.x = x;
    this.y = y;
    this.baseAngle = baseAngle; // centre of the sweep, radians
    this.sweep = sweep; // how far either side it swings, radians
    this.speed = speed; // radians per second of the sweep phase
    this.phase = phase;
    this.angle = baseAngle;
    this.seesThief = false;
    this.blink = 0; // red recording light timer
  }

  update(dt, thief, smokes) {
    this.phase += dt * this.speed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
    this.blink += dt;
    this.seesThief = this.canSee(thief.x, thief.y, smokes);
  }

  canSee(tx, ty, smokes) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAMERA_VIEW_RANGE) return false;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), this.angle)) > CAMERA_VIEW_HALF_ANGLE) return false;
    if (lineBlocked(this.x, this.y, tx, ty)) return false;
    for (const s of smokes) {
      if (Math.hypot(tx - s.x, ty - s.y) < s.r) return false;
      const steps = Math.max(1, Math.ceil(dist / 8));
      for (let i = 1; i < steps; i++) {
        const px = this.x + (dx * i) / steps;
        const py = this.y + (dy * i) / steps;
        if (Math.hypot(px - s.x, py - s.y) < s.r) return false;
      }
    }
    return true;
  }
}

export function createCameras() {
  return [
    new Camera(70, 60, Math.PI * 0.28, 0.85, 0.55, 0), // top-left, sweeps the west hall
    new Camera(1210, 60, Math.PI * 0.72, 0.85, 0.45, 2.1), // top-right, sweeps the vault
    new Camera(1210, 660, -Math.PI * 0.72, 0.8, 0.5, 4.2), // bottom-right, sweeps the south hall
  ];
}
