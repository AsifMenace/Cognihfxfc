import crypto from 'crypto';

// Stateless admin session tokens. A token is `base64(expiryMs).HMAC_SHA256(expiryMs)`
// signed with SESSION_SECRET. No password is ever stored client-side or replayed —
// login exchanges the password once for a signed, self-expiring token.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getSecret = () => process.env.SESSION_SECRET || '';

export function signToken(ttlMs = SEVEN_DAYS_MS) {
  const secret = getSecret();
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  const payload = String(Date.now() + ttlMs);
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${sig}`;
}

export function verifyToken(token) {
  const secret = getSecret();
  if (!secret || !token || typeof token !== 'string') return false;

  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload;
  try {
    payload = Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  const expiry = parseInt(payload, 10);
  return Number.isFinite(expiry) && Date.now() <= expiry;
}
