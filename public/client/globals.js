/**
 * globals
 */
export const win = window;
/**
 * `m`, `c`, and `b` are provided by id attributes on the main, canvas, and
 * button elements (respectively) in `'../index.html'`, `io` is provided by the
 * Socket.IO script (also in `'../index.html'`)
 */
export const {
  m,
  c,
  b,
  io,
  devicePixelRatio: dpr,
  requestAnimationFrame: raf,
} = win;
export const { floor, max, PI: π, random, round, sin } = Math;
export const ctx = c.getContext('2d');
