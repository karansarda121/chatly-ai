import { Router } from "express";

import { changePassword, getMe, getVerificationStatus, login, register, requestPasswordReset, resendPasswordResetOtp, resendVerificationOtp, resetPassword, updateProfile, verifyEmail, verifyPasswordResetOtp } from "../controllers/authController.js";
import { updateAvatar } from '../controllers/uploadController.js';
import { protect } from "../middleware/auth.js";
import { authRateLimiter, verificationEmailRateLimiter } from "../middleware/rateLimit.js";
import { uploadAvatar } from "../middleware/upload.js";
import { validateEmailVerification, validateLogin, validatePasswordChange, validatePasswordReset, validateProfileUpdate, validateRegistration, validateVerificationResend } from "../middleware/validate.js";

const router = Router();

router.post("/register", authRateLimiter, validateRegistration, register);
router.post("/verification-status", authRateLimiter, validateVerificationResend, getVerificationStatus);
router.post("/verify-email", authRateLimiter, validateEmailVerification, verifyEmail);
router.post("/resend-verification-otp", verificationEmailRateLimiter, validateVerificationResend, resendVerificationOtp);
router.post("/forgot-password", verificationEmailRateLimiter, validateVerificationResend, requestPasswordReset);
router.post("/resend-password-reset-otp", verificationEmailRateLimiter, validateVerificationResend, resendPasswordResetOtp);
router.post("/verify-password-reset-otp", authRateLimiter, validateEmailVerification, verifyPasswordResetOtp);
router.post("/reset-password", authRateLimiter, validatePasswordReset, resetPassword);
router.post("/login", authRateLimiter, validateLogin, login);
router.get("/me", protect, getMe);
router.put("/me", protect, validateProfileUpdate, updateProfile);
router.put("/change-password", protect, validatePasswordChange, changePassword);
router.put("/avatar", protect, uploadAvatar.single("avatar"), updateAvatar);

export default router;