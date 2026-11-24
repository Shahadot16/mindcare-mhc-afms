import rateLimit from 'express-rate-limit';

/** Slows down password guessing: 20 failed attempts per 15 minutes per IP (successful logins don't count). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});
