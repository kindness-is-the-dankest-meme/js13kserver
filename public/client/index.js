import { subscribe } from './events.js';
import { b, c, ctx, dpr, m, raf, sin, π } from './globals.js';
import { channel, channelSend, negotiate } from './negotiate.js';
import { resize } from './resize.js';

/**
 * state
 */
const scale = 16;
const pointers = {};
const isGuest = !!navigator.userAgent.match('Mobile');

if (isGuest) {
  subscribe(
    b,
    'click',
    () => {
      navigator.mediaDevices?.getUserMedia({ audio: false, video: false });
      negotiate(isGuest);
      b.remove();
    },
    { once: true },
  );
} else {
  negotiate(isGuest);
  b.remove();
}

resize(m, c, scale);

const messageFromPointerEvent = ({
  type,
  pointerType: ptype,
  pointerId: pid,
  clientX: x,
  clientY: y,
}) => ({ type, ptype, pid, x, y });

let unsub;

subscribe(channel, 'open', (event) => {
  console.log('open', event);

  const us = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
  ].reduce(
    (acc, eventName) => {
      acc.push(
        subscribe(c, eventName, (event) => {
          event.preventDefault();
          channelSend(messageFromPointerEvent(event));
        }),
      );

      return acc;
    },
    [
      subscribe(channel, 'message', (event) => {
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
      }),
    ],
  );

  unsub = () => us.forEach((u) => u());
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
