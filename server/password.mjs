import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const run = promisify(scrypt);
const N = 16384, R = 8, P = 1, LEN = 64;
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await run(password.normalize('NFKC'), salt, LEN, { N, r: R, p: P });
  return `scrypt$${N}$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[2], 'hex'), expected = Buffer.from(parts[3], 'hex');
  const key = await run(password.normalize('NFKC'), salt, expected.length, { N: Number(parts[1]), r: R, p: P });
  return key.length === expected.length && timingSafeEqual(key, expected);
}
