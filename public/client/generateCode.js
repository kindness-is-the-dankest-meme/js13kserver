import { floor, random } from './globals.js';

/**
 * get a random 4-character string
 */
const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const generateCode = () =>
  Array(4)
    .fill(0)
    .map(() => chars[floor(random() * chars.length)])
    .join('');
