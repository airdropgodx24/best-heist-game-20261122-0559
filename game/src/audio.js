// The Velvet Vault — tiny WebAudio bleeps, no audio files.
// One job: make the pickup chirp, the alarm tick, and the win/lose jingles.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type = 'sine', volume = 0.12, when = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    try {
      const t0 = ac.currentTime + when;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.02);
    } catch {
      // Sound is garnish; a blocked AudioContext must never break the game.
    }
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pickup() { tone(880, 0.12, 'sine', 0.14); tone(1320, 0.16, 'sine', 0.1, 0.07); },
    coin() { tone(1560, 0.08, 'triangle', 0.1); },
    smoke() { tone(220, 0.3, 'sine', 0.08); tone(160, 0.35, 'sine', 0.07, 0.08); },
    spotted() { tone(440, 0.14, 'square', 0.07); tone(440, 0.14, 'square', 0.07, 0.18); },
    alarmTick() { tone(980, 0.06, 'square', 0.045); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'sine', 0.13, i * 0.13));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.16));
    },
  };
}
