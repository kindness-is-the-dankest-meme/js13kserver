import { dispatch, subscribe } from './events.js';
import { dpr, max } from './globals.js';

const nearest = (multipleOf = 1, startingAt = 0) =>
  multipleOf !== 0 && startingAt % multipleOf !== 0
    ? startingAt + (multipleOf - (startingAt % multipleOf))
    : startingAt;

const px = (n) => `${n}px`;

/**
 * resizing
 */
export const resize = (container, target, scale = 1) => {
  subscribe(container, 'resize', () => {
    const { clientWidth: cw, clientHeight: ch } = container;

    const sw = nearest(scale, cw);
    const sh = nearest(scale, ch);

    target.width = (sw * dpr) / scale;
    target.height = (sh * dpr) / scale;

    target.style.width = px(target.width);
    target.style.height = px(target.height);

    target.style.transform = `scale(${max(
      cw / target.width,
      ch / target.height,
    )})`;
  });

  dispatch(container, 'resize');
};
