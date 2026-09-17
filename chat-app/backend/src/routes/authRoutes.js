import { Router } from "express";

import { changePassword, changeUnverifiedEmail, getMe, getVerificationStatus, login, register, requestPasswordReset, resendPasswordResetOtp, resendVerificationOtp, resetPassword, updateProfile, verifyEmail, verifyPasswordResetOtp } from "../controllers/authController.js";
import { updateAvatar } from '../controllers/uploadController.js';
import { protect } from "../middleware/auth.js";
import { loginCredentialRateLimiter, loginIpRateLimiter, passwordResetEmailRateLimiter, registrationRateLimiter, verificationEmailRateLimiter } from "../middleware/rateLimit.js";
import { uploadAvatar } from "../middleware/upload.js";
import { validateEmailVerification, validateLogin, validatePasswordChange, validatePasswordReset, validateProfileUpdate, validateRegistration, validateUnverifiedEmailChange, validateVerificationResend } from "../middleware/validate.js";

const router = Router();

router.post("/register", registrationRateLimiter, validateRegistration, register);
router.post("/verification-status", validateVerificationResend, getVerificationStatus);
router.post("/verify-email", validateEmailVerification, verifyEmail);
router.post("/resend-verification-otp", verificationEmailRateLimiter, validateVerificationResend, resendVerificationOtp);
router.post("/change-unverified-email", registrationRateLimiter, validateUnverifiedEmailChange, changeUnverifiedEmail);
router.post("/forgot-password", passwordResetEmailRateLimiter, validateVerificationResend, requestPasswordReset);
router.post("/resend-password-reset-otp", passwordResetEmailRateLimiter, validateVerificationResend, resendPasswordResetOtp);
router.post("/verify-password-reset-otp", validateEmailVerification, verifyPasswordResetOtp);
router.post("/reset-password", validatePasswordReset, resetPassword);
router.post("/login", loginIpRateLimiter, loginCredentialRateLimiter, validateLogin, login);
router.get("/me", protect, getMe);
router.put("/me", protect, validateProfileUpdate, updateProfile);
router.put("/change-password", protect, validatePasswordChange, changePassword);
router.put("/avatar", protect, uploadAvatar.single("avatar"), updateAvatar);

export default router;