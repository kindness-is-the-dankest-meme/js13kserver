import { subscribe } from './events.js';
import { c, ctx, dpr, m, raf, sin, π } from './globals.js';
import { channel, negotiate } from './negotiate.js';
import { resize } from './resize.js';

/**
 * state
 */
const scale = 16;
const pointers = {};

resize(m, c, scale);
negotiate(location.hash === '#guest');

let unsub;
subscribe(channel, 'open', (event) => {
  console.log('open', event);

  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(
    (eventName) =>
      subscribe(
        c,
        eventName,
        ({ type, pointerType: ptype, pointerId: pid, x, y }) =>
          channel.send(JSON.stringify({ type, ptype, pid, x, y })),
      ),
  );

  unsub = subscribe(channel, 'message', (event) => {
    console.log('message', event);

    const { type, ptype, pid, x, y } = JSON.parse(event.data);

    switch (type) {
      case 'pointerdown':
        pointers[`${ptype}:${pid}`] = { h: floor(random() * 360), x, y };
        break;

      case 'pointermove':
        if (pointers[`${ptype}:${pid}`]) {
          pointers[`${ptype}:${pid}`].x = x;
          pointers[`${ptype}:${pid}`].y = y;
        }
        break;

      case 'pointerup':
      case 'pointercancel':
        delete pointers[`${ptype}:${pid}`];
        break;
    }
  });
});

['close', 'error'].forEach((eventName) =>
  subscribe(channel, eventName, (event) => {
    console.log(eventName, event);
    unsub?.();
  }),
);

/**
 * game loop
 */
const draw = (t) => {
  raf(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  Object.values(pointers).forEach(({ h, x, y }) => {
    ctx.fillStyle = `hsl(${h}, 80%, 50%)`;

    ctx.beginPath();

    const p = 20 / scale;
    const r = (p * 2 + sin((t + h) / 360) * p) * dpr;
    ctx.ellipse((x / scale) * dpr, (y / scale) * dpr, r, r, 0, 0, π * 2);
    ctx.fill();
  });
};
raf(draw);
