import rateLimit from 'express-rate-limit';

/**
 * Login and registration are deliberately limited more strictly than normal
 * APIs to reduce password-guessing and account-creation abuse.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

/** Limits verification emails so an address cannot be spammed. */
export const verificationEmailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many verification emails requested. Please try again in 15 minutes.' },
});

/** Limits paid AI requests per signed-in user instead of only by IP address. */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.AI_RATE_LIMIT_PER_HOUR || 20),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
  message: { message: 'AI summary limit reached. Please try again later.' },
});
