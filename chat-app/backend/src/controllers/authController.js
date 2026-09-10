import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import User from '../models/User.js';
import { sendPasswordResetOtpEmail, sendVerificationOtpEmail } from '../services/emailService.js';
import { generateToken } from '../utils/generateToken.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const UNVERIFIED_ACCOUNT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function sendAuthResponse(res, statusCode, user) {
  return res.status(statusCode).json({ token: generateToken(user._id), user: user.toSafeObject() });
}

function getVerificationState(user) {
  const now = Date.now();
  const isOtpActive = Boolean(user.emailVerificationOtpHash
    && user.emailVerificationExpiresAt
    && user.emailVerificationExpiresAt.getTime() > now);

  return {
    verificationRequired: true,
    email: user.email,
    otpExpiresAt: isOtpActive ? user.emailVerificationExpiresAt.toISOString() : null,
    // A verification code is never replaced while it is still valid.
    resendAvailableAt: isOtpActive ? user.emailVerificationExpiresAt.toISOString() : null,
  };
}

function verificationResponse(res, statusCode, user, message) {
  return res.status(statusCode).json({ ...getVerificationState(user), message });
}

function clearVerificationOtp(user) {
  user.emailVerificationOtpHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = undefined;
}

async function createAndSendVerificationOtp(user) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.emailVerificationOtpHash = await bcrypt.hash(otp, 10);
  user.emailVerificationExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = new Date();
  await user.save();

  try {
    await sendVerificationOtpEmail({ email: user.email, otp });
  } catch (error) {
    // Do not leave the user waiting for an OTP that email delivery did not send.
    clearVerificationOtp(user);
    await user.save();
    throw error;
  }
}

export async function register(req, res, next) {
  try {
    const username = req.body.username.trim();
    const email = req.body.email.trim().toLowerCase();
    const displayName = req.body.displayName?.trim() || '';
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(409).json({ message: `That ${existingUser.email === email ? 'email address' : 'username'} is already in use.` });

    const user = await User.create({
      username, email, displayName, password: req.body.password, emailVerified: false,
      unverifiedAccountExpiresAt: new Date(Date.now() + UNVERIFIED_ACCOUNT_EXPIRY_MS),
    });

    try {
      await createAndSendVerificationOtp(user);
      return verificationResponse(res, 201, user, 'We sent a 6-digit verification code to your email. Check your inbox and spam folder.');
    } catch {
      // The account remains unverified, and the OTP helper clears any code that
      // was not delivered. The client can take the user to the retry screen.
      return verificationResponse(res, 503, user, 'Your account was created, but we could not send the verification code. Try again to receive a new code.');
    }
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That username or email address is already in use.' });
    return next(error);
  }
}

export async function getVerificationStatus(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || user.isSystemBot) return res.status(404).json({ message: 'This registration was not found. Please register again.' });
    if (user.emailVerified) return res.status(400).json({ message: 'This email address is already verified. Please log in.' });
    return verificationResponse(res, 200, user, user.emailVerificationExpiresAt > new Date() ? 'Enter the code sent to your email.' : 'Your previous code expired. Send a new code to continue.');
  } catch (error) { return next(error); }
}

export async function verifyEmail(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || user.isSystemBot) return res.status(400).json({ message: 'This verification code is invalid or has expired.' });
    if (user.emailVerified) return res.status(400).json({ message: 'This email address is already verified. Please log in.' });
    if (!user.emailVerificationOtpHash || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) {
      clearVerificationOtp(user);
      await user.save();
      return res.status(400).json({ message: 'This verification code has expired. Send a new code to continue.' });
    }
    if (user.emailVerificationAttempts >= MAX_OTP_ATTEMPTS) {
      clearVerificationOtp(user);
      await user.save();
      return res.status(429).json({ message: 'Too many incorrect attempts. Send a new code to continue.' });
    }
    const isValid = await bcrypt.compare(req.body.otp, user.emailVerificationOtpHash);
    if (!isValid) {
      user.emailVerificationAttempts += 1;
      await user.save();
      return res.status(400).json({ message: `Invalid code. ${MAX_OTP_ATTEMPTS - user.emailVerificationAttempts} attempt(s) remaining.` });
    }

    user.emailVerified = true;
    user.unverifiedAccountExpiresAt = undefined;
    clearVerificationOtp(user);
    await user.save();
    return res.json({ message: 'Email verified successfully. Please log in.' });
  } catch (error) { return next(error); }
}

export async function resendVerificationOtp(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || user.isSystemBot || user.emailVerified) {
      return res.json({ message: 'If this account needs verification, a new code has been sent.' });
    }
    if (user.emailVerificationOtpHash && user.emailVerificationExpiresAt > new Date()) {
      return res.status(409).json({
        ...getVerificationState(user),
        message: 'Your verification code is still active. Check your inbox or wait for it to expire before requesting a new one.',
      });
    }
    await createAndSendVerificationOtp(user);
    return verificationResponse(res, 200, user, 'A new verification code has been sent.');
  } catch (error) { return next(error); }
}

function getPasswordResetState(user) {
  const now = Date.now();
  const isOtpActive = Boolean(user.passwordResetOtpHash && user.passwordResetExpiresAt && user.passwordResetExpiresAt.getTime() > now);
  const resendAt = user.passwordResetLastSentAt ? new Date(user.passwordResetLastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS) : null;
  return { passwordResetRequested: true, email: user.email, otpExpiresAt: isOtpActive ? user.passwordResetExpiresAt.toISOString() : null, resendAvailableAt: isOtpActive && resendAt?.getTime() > now ? resendAt.toISOString() : null };
}

function clearPasswordReset(user) {
  user.passwordResetOtpHash = undefined; user.passwordResetExpiresAt = undefined; user.passwordResetAttempts = 0; user.passwordResetLastSentAt = undefined; user.passwordResetTokenHash = undefined; user.passwordResetTokenExpiresAt = undefined;
}

async function createAndSendPasswordResetOtp(user) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
  user.passwordResetExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.passwordResetAttempts = 0; user.passwordResetLastSentAt = new Date(); user.passwordResetTokenHash = undefined; user.passwordResetTokenExpiresAt = undefined;
  await user.save();

  try {
    await sendPasswordResetOtpEmail({ email: user.email, otp });
  } catch (error) {
    clearPasswordReset(user);
    await user.save();
    throw error;
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    // Keep this response generic for unknown and unverified addresses so this endpoint
    // cannot be used to discover which email accounts exist.
    if (!user || user.isSystemBot || user.emailVerified === false) return res.json({ message: 'If an eligible account exists, a password reset code has been sent.' });

    const resetState = getPasswordResetState(user);
    // Submitting the first form again must not silently invalidate an email code that
    // the user may still be reading. A replacement is available only via resend.
    if (resetState.otpExpiresAt) {
      return res.json({ ...resetState, message: 'A reset code was already sent. Check your inbox and spam folder.' });
    }

    await createAndSendPasswordResetOtp(user);
    return res.json({ ...getPasswordResetState(user), message: 'We sent a 6-digit reset code to your email.' });
  } catch (error) { return next(error); }
}

export async function resendPasswordResetOtp(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || user.isSystemBot || user.emailVerified === false) return res.json({ message: 'If an eligible account exists, a password reset code has been sent.' });
    const elapsed = Date.now() - new Date(user.passwordResetLastSentAt || 0).getTime();
    if (user.passwordResetOtpHash && user.passwordResetExpiresAt > new Date() && elapsed < OTP_RESEND_COOLDOWN_MS) return res.status(429).json({ ...getPasswordResetState(user), message: `Please wait ${Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000)} seconds before requesting another code.` });
    await createAndSendPasswordResetOtp(user);
    return res.json({ ...getPasswordResetState(user), message: 'A new reset code has been sent.' });
  } catch (error) { return next(error); }
}

export async function verifyPasswordResetOtp(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    if (!user || user.isSystemBot || !user.passwordResetOtpHash || !user.passwordResetExpiresAt) return res.status(400).json({ message: 'This reset code is invalid or expired. Request a new code.' });
    if (user.passwordResetExpiresAt <= new Date()) {
      clearPasswordReset(user);
      await user.save();
      return res.status(400).json({ message: 'This reset code expired. Request a new code.' });
    }
    if (user.passwordResetAttempts >= MAX_OTP_ATTEMPTS) { clearPasswordReset(user); await user.save(); return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' }); }
    if (!(await bcrypt.compare(req.body.otp, user.passwordResetOtpHash))) { user.passwordResetAttempts += 1; await user.save(); return res.status(400).json({ message: `Invalid code. ${MAX_OTP_ATTEMPTS - user.passwordResetAttempts} attempt(s) remaining.` }); }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.passwordResetOtpHash = undefined; user.passwordResetExpiresAt = undefined; user.passwordResetAttempts = 0; user.passwordResetLastSentAt = undefined;
    await user.save();
    return res.json({ resetToken, message: 'Code verified. Create your new password.' });
  } catch (error) { return next(error); }
}

export async function resetPassword(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    const tokenHash = crypto.createHash('sha256').update(req.body.resetToken).digest('hex');
    if (!user || !user.passwordResetTokenHash || user.passwordResetTokenHash !== tokenHash || !user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt <= new Date()) return res.status(400).json({ message: 'Your password reset session expired. Request a new code.' });
    user.password = req.body.newPassword;
    clearPasswordReset(user);
    await user.save();
    return res.json({ message: 'Password updated successfully. Please log in.' });
  } catch (error) { return next(error); }
}
export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    if (!user || user.isSystemBot || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Incorrect email or password.' });
    if (user.emailVerified === false) return res.status(403).json({ code: 'EMAIL_NOT_VERIFIED', ...getVerificationState(user), message: 'Verify your email before logging in.' });
    return sendAuthResponse(res, 200, user);
  } catch (error) { return next(error); }
}

export async function changePassword(req, res, next) {
  try {
    if (!(await req.user.comparePassword(req.body.currentPassword))) return res.status(401).json({ message: 'Current password is incorrect.' });
    req.user.password = req.body.newPassword;
    await req.user.save();
    return res.json({ message: 'Password changed successfully.' });
  } catch (error) { return next(error); }
}

export async function updateProfile(req, res, next) {
  try {
    req.user.displayName = req.body.displayName.trim();
    await req.user.save();
    return res.json({ message: 'Display name updated successfully.', user: req.user.toSafeObject() });
  } catch (error) { return next(error); }
}

export function getMe(req, res) { return res.json({ user: req.user.toSafeObject() }); }