// The Velvet Vault — keyboard and mouse input.
// One job: turn keys and clicks into a movement vector, a click-to-move
// target, and one-shot tool presses the game loop can consume.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    moveX: 0,
    moveY: 0,
    target: null, // {x, y} click-to-move destination, or null
    smokePressed: false,
    coinPressed: false,
    anyKeyPressed: false,
    mouse: { x: 0, y: 0 },
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function refreshMove() {
    let x = 0;
    let y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    state.moveX = x;
    state.moveY = y;
    if (x !== 0 || y !== 0) state.target = null; // keys override click-to-move
  }

  window.addEventListener('keydown', (e) => {
    state.anyKeyPressed = true;
    if (KEYMAP[e.code]) {
      keys.add(KEYMAP[e.code]);
      refreshMove();
      e.preventDefault();
    } else if (e.code === 'KeyQ') {
      state.smokePressed = true;
    } else if (e.code === 'KeyE') {
      state.coinPressed = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) {
      keys.delete(KEYMAP[e.code]);
      refreshMove();
    }
  });
  window.addEventListener('blur', () => {
    keys.clear();
    refreshMove();
  });

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    state.mouse = p;
    // A click on the top HUD band is a tool button, not a move order.
    if (p.y < 54) return;
    state.target = p;
  });
  canvas.addEventListener('pointermove', (e) => {
    state.mouse = canvasPoint(e);
  });

  // One-shot presses: the game loop calls these once per frame.
  state.consumeSmoke = () => {
    const v = state.smokePressed;
    state.smokePressed = false;
    return v;
  };
  state.consumeCoin = () => {
    const v = state.coinPressed;
    state.coinPressed = false;
    return v;
  };
  state.consumeAnyKey = () => {
    const v = state.anyKeyPressed;
    state.anyKeyPressed = false;
    return v;
  };
  return state;
}
