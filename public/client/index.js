import { subscribe } from './events.js';
import { c, ctx, dpr, floor, m, raf, random, sin, π } from './globals.js';
import { channelSend, negotiate } from './negotiate.js';
import { resize } from './resize.js';

/**
 * state
 */
const scale = 16;
const pointers = {};

resize(m, c, scale);

const messageFromPointerEvent = ({
  type,
  pointerType: ptype,
  pointerId: pid,
  clientX: x,
  clientY: y,
}) => ({ type, ptype, pid, x, y });

const us = [];
negotiate(
  !!navigator.userAgent.match('Mobile'),
  (/* event */) => {
    // console.log(event.type, event);

    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(
      (eventName) =>
        us.push(
          subscribe(c, eventName, (event) => {
            event.preventDefault();
            channelSend(messageFromPointerEvent(event));
          }),
        ),
    );
  },
  (event) => {
    // console.log(event.type, event);

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
  },
  (/* event */) => {
    // console.log(event.type, event);

    us.forEach((u) => u());
    us.length = 0;
  },
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
