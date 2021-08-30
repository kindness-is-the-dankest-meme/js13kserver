/**
 * globals
 */
const win = window;
const { devicePixelRatio: dpr, requestAnimationFrame: raf } = win;
const ctx = c.getContext('2d');
const { floor, PI: π, random, sin } = Math;

/**
 * events
 */
const subscribe = (target, type, listener, options = false) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

const dispatch = (target, type) => target.dispatchEvent(new Event(type));

/**
 * resizing
 */
subscribe(win, 'resize', () => {
  const { innerWidth: w, innerHeight: h } = win;

  c.width = w * dpr;
  c.height = h * dpr;

  c.style.width = `${c.width}px`;
  c.style.height = `${c.height}px`;
  c.style.transform = `scale(${1 / dpr})`;
});

dispatch(win, 'resize');

/**
 * socket
 */
io({ upgrade: false, transports: ['websocket'] });

/**
 * state
 */
const state = {};

const addPointer = ({ pointerId, pointerType, x, y }) => {
  state[`${pointerType}:${pointerId}`] = { h: floor(random() * 360), x, y };
};
const updatePointer = ({ pointerId, pointerType, x, y }) => {
  state[`${pointerType}:${pointerId}`] = { x, y };
};
const removePointer = ({ pointerId, pointerType }) => {
  delete state[`${pointerType}:${pointerId}`];
};

subscribe(c, 'pointerdown', (event) => {
  addPointer(event);

  const unsub = subscribe(c, 'pointermove', updatePointer);
  const cleanup = (event) => {
    removePointer(event);
    unsub();
  };

  subscribe(c, 'pointerup', cleanup, { once: true });
  subscribe(c, 'pointercancel', cleanup, { once: true });
});

/**
 * game loop
 */
const draw = (t) => {
  raf(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  Object.values(state).forEach(({ h, x, y }) => {
    ctx.fillStyle = `hsl(${h}, 80%, 50%)`;

    ctx.beginPath();

    const p = 10;
    const r = (p * 2 + sin(t / 400) * p) * dpr;
    ctx.ellipse(x * dpr, y * dpr, r, r, 0, 0, π * 2);
    ctx.fill();
  });
};

raf(draw);
