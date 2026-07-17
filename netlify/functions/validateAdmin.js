import { verifyToken } from './sessionToken.js';

export function validateAdmin(event) {
  const token = event.headers?.['x-admin-token'] ?? '';
  return verifyToken(token);
}
