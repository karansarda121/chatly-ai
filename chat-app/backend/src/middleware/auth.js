import jwt from 'jsonwebtoken';

import User from '../models/User.js';

/**
 * Requires a Bearer token and attaches its real, current user to req.user.
 * Routes that need a logged-in user put this middleware before their handler.
 */
export async function protect(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET is not configured.'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.isSystemBot || user.emailVerified === false) {
      return res.status(401).json({ message: 'Your session is no longer valid.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session is invalid or has expired.' });
    }

    return next(error);
  }
}
