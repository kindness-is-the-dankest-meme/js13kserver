import { subscribe } from './events.js';
import { generateCode } from './generateCode.js';
import {
  c,
  ctx,
  dpr,
  floor,
  io,
  m,
  raf,
  random,
  sin,
  win,
  π,
} from './globals.js';
import { channel, negotiate } from './negotiate.js';
import { resize } from './resize.js';

const scale = 16;
resize(m, c, scale);

/**
 * socket
 */
negotiate('ontouchstart' in win);

subscribe(channel, 'open', (event) => {
  console.log('open', event);
});

subscribe(channel, 'close', (event) => {
  console.log('close', event);
});

subscribe(channel, 'error', (event) => {
  console.log('error', event);
});

subscribe(channel, 'message', (event) => {
  console.log('message', event);
});

/**
 * state
 */
const state = {};

const addPointer = ({ pointerType: type, pointerId: id, x, y }) => {
  state[`${type}:${id}`] = { h: floor(random() * 360), x, y };
};
const updatePointer = ({ pointerType: type, pointerId: id, x, y }) => {
  if (!state[`${type}:${id}`]) {
    return;
  }

  state[`${type}:${id}`].x = x;
  state[`${type}:${id}`].y = y;
};
const removePointer = ({ pointerType: type, pointerId: id }) => {
  delete state[`${type}:${id}`];
};

subscribe(c, 'pointerdown', addPointer);
subscribe(c, 'pointermove', updatePointer);
subscribe(c, 'pointerup', removePointer);
subscribe(c, 'pointercancel', removePointer);

/**
 * game loop
 */
const draw = (t) => {
  raf(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  Object.values(state).forEach(({ h, x, y }) => {
    ctx.fillStyle = `hsl(${h}, 80%, 50%)`;

    ctx.beginPath();

    const p = 20 / scale;
    const r = (p * 2 + sin((t + h) / 360) * p) * dpr;
    ctx.ellipse((x / scale) * dpr, (y / scale) * dpr, r, r, 0, 0, π * 2);
    ctx.fill();
  });
};

raf(draw);
