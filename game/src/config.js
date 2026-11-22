// The Velvet Vault — shared tuning numbers and colours.
// One job: every magic number the rest of the game reads lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WALL = 24;

export const THIEF_SPEED = 210;
export const THIEF_RADIUS = 14;
export const GUARD_SPEED_PATROL = 72;
export const GUARD_SPEED_CHASE = 138;
export const GUARD_RADIUS = 15;
export const GUARD_VIEW_RANGE = 230;
export const GUARD_VIEW_HALF_ANGLE = 0.61; // ~35 degrees each side
export const CAMERA_VIEW_RANGE = 270;
export const CAMERA_VIEW_HALF_ANGLE = 0.5; // ~29 degrees each side

export const ALARM_GUARD_RATE = 30; // per second while a guard sees the thief
export const ALARM_CAMERA_RATE = 22; // per second while a camera sees the thief
export const ALARM_CHASE_RATE = 38; // per second while any guard is chasing
export const ALARM_DECAY_RATE = 11; // per second while nobody sees the thief
export const ALARM_MAX = 100;

export const SMOKE_START = 2;
export const SMOKE_RADIUS = 95;
export const SMOKE_SECONDS = 6;
export const COIN_START = 3;
export const COIN_LURE_SECONDS = 3.5;

export const COLORS = {
  floor: '#241f3d',
  floorTile: '#2a2447',
  carpet: '#3a2b52',
  carpetEdge: '#4a3a68',
  wall: '#171226',
  wallEdge: '#3d3460',
  coverWood: '#6b4a2f',
  coverWoodTop: '#8a6238',
  coverMetal: '#4d5a6e',
  coverMetalTop: '#6d7f99',
  coverPlant: '#2e6b34',
  coverPlantTop: '#3f8f46',
  coneGuard: 'rgba(255, 196, 66, 0.30)',
  coneGuardAlert: 'rgba(255, 72, 72, 0.42)',
  coneCamera: 'rgba(255, 84, 84, 0.28)',
  thief: '#f2d06b',
  thiefCoat: '#2b2b3a',
  guard: '#c94f4f',
  guardSuit: '#3a3f52',
  camera: '#d8d8e0',
  lootDiamond: '#7fe7ff',
  lootGold: '#ffd94d',
  lootCash: '#7ddb7d',
  lootGem: '#ff7fd4',
  exit: '#39d98a',
  alarmLow: '#39d98a',
  alarmMid: '#f2c14e',
  alarmHigh: '#ff4d4d',
  smoke: 'rgba(200, 200, 215, 0.55)',
  hudBg: 'rgba(10, 8, 20, 0.82)',
  hudText: '#efeaf7',
  hudMuted: '#a89fc7',
};
