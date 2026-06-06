const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Rate limiter: email → timestamps[]
const attemptMap = new Map<string, number[]>();

// Gate tokens: token → { email, expiresAt }
const tokenMap = new Map<string, { email: string; expiresAt: number }>();

/**
 * Check if an email is rate limited.
 * Cleans up expired entries before checking.
 */
export function checkRateLimit(email: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let attempts = attemptMap.get(email) || [];

  // Remove expired attempts
  attempts = attempts.filter((ts) => ts > windowStart);

  if (attempts.length >= MAX_ATTEMPTS) {
    const oldest = attempts[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000 / 60);
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - attempts.length };
}

/**
 * Record an attempt for an email.
 */
export function recordAttempt(email: string): void {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  let attempts = attemptMap.get(email) || [];
  attempts = attempts.filter((ts) => ts > windowStart);
  attempts.push(now);
  attemptMap.set(email, attempts);
}

/**
 * Generate a gate token for a verified email.
 */
export function generateGateToken(email: string): string {
  const token = crypto.randomUUID();
  tokenMap.set(token, {
    email,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  // Clean up old tokens periodically
  if (tokenMap.size > 1000) {
    const now = Date.now();
    for (const [key, value] of tokenMap) {
      if (value.expiresAt < now) tokenMap.delete(key);
    }
  }

  return token;
}

/**
 * Verify a gate token and return the associated email.
 */
export function verifyGateToken(token: string): string | null {
  const entry = tokenMap.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenMap.delete(token);
    return null;
  }
  // Consume the token (one-time use)
  tokenMap.delete(token);
  return entry.email;
}
