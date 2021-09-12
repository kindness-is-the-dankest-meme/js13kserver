/**
 * globals
 */
export const win = window;
/**
 * `m` and `c` are provided by id attributes on the main and canvas elements
 * (respectively) in `'../index.html'`, `io` is provided by the Socket.IO script
 * (also in `'../index.html'`)
 */
export const {
  m,
  c,
  io,
  devicePixelRatio: dpr,
  requestAnimationFrame: raf,
} = win;
export const { floor, max, PI: π, random, round, sin } = Math;
export const ctx = c.getContext('2d');
