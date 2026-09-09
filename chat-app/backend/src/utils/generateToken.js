import jwt from 'jsonwebtoken';

/**
 * Creates the short-lived credential that proves which user is making a
 * request. The token only contains the user id; user details stay in MongoDB.
 */
export function generateToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
