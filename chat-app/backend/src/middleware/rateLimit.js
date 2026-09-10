import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function normalizedEmail(req) {
  const email = req.body?.email;
  return typeof email === 'string' && email.trim()
    ? email.trim().toLowerCase()
    : 'missing-email';
}

function waitMessage(label, req) {
  const resetTime = req.rateLimit?.resetTime?.getTime?.();
  const seconds = resetTime
    ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))
    : 60;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const wait = minutes > 0
    ? `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
    : `${remainingSeconds} seconds`;

  return { message: `Too many ${label}. Try again in ${wait}.`, retryAfterSeconds: seconds };
}

function createLimiter({ windowMs, limit, label, keyGenerator, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator,
    skipSuccessfulRequests,
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(waitMessage(label, req));
    },
  });
}

/** A light bot-abuse guard for account creation from one public network. */
export const registrationRateLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 15,
  label: 'registration attempts from this network',
});

/** Broad protection against password spraying from one public IP address. */
export const loginIpRateLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 30,
  label: 'login attempts from this network',
  skipSuccessfulRequests: true,
});

/** Limits failed password guesses for one email address. */
export const loginCredentialRateLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  label: 'login attempts for this account',
  keyGenerator: normalizedEmail,
  skipSuccessfulRequests: true,
});

/** Prevents one address from being flooded with verification emails. */
export const verificationEmailRateLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  label: 'verification emails for this address',
  keyGenerator: (req) => `email-verification-send:${normalizedEmail(req)}`,
});

/** Prevents one address from being flooded with password-reset emails. */
export const passwordResetEmailRateLimiter = createLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  label: 'password-reset emails for this address',
  keyGenerator: (req) => `password-reset-send:${normalizedEmail(req)}`,
});

/** Limits paid AI requests per signed-in user instead of only by IP address. */
export const aiRateLimiter = createLimiter({
  windowMs: ONE_HOUR,
  limit: Number(process.env.AI_RATE_LIMIT_PER_HOUR || 20),
  label: 'AI requests',
  keyGenerator: (req) => req.user._id.toString(),
});