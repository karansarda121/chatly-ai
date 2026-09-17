import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Per-user mute state for a chat. `mutedUntil: null` means muted indefinitely
 * (until explicitly unmuted); a Date means auto-unmute after that time.
 */
const mutedChatSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    mutedUntil: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Not required for the system bot user - it never logs in, so it has no password.
      required: function () {
        return !this.isSystemBot;
      },
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    // ImageKit's identifier is stored so a replaced avatar can be deleted.
    avatarFileId: {
      type: String,
      default: "",
    },

    // --- Email verification ---
    // Existing accounts without this field remain usable; newly registered accounts explicitly start unverified.
    emailVerified: { type: Boolean, default: true },
    emailVerificationOtpHash: { type: String, default: undefined },
    emailVerificationExpiresAt: { type: Date, default: undefined },
    emailVerificationAttempts: { type: Number, default: 0 },
    emailVerificationLastSentAt: { type: Date, default: undefined },
    // A short-lived, opaque token held only by the browser that started
    // registration. It authorizes correcting a typo before verification.
    verificationSessionTokenHash: { type: String, default: undefined },
    verificationSessionTokenExpiresAt: { type: Date, default: undefined },
    // MongoDB TTL index removes abandoned, unverified registrations after seven days.
    unverifiedAccountExpiresAt: { type: Date, default: undefined },

    // --- Password reset ---
    passwordResetOtpHash: { type: String, default: undefined },
    passwordResetExpiresAt: { type: Date, default: undefined },
    passwordResetAttempts: { type: Number, default: 0 },
    passwordResetLastSentAt: { type: Date, default: undefined },
    passwordResetTokenHash: { type: String, default: undefined },
    passwordResetTokenExpiresAt: { type: Date, default: undefined },

    // --- System bot flag ---
    // True only for the single seeded "AI Assistant" user. Never logs in;
    // only ever appears as the second member of a private assistant `direct` chat.
    isSystemBot: {
      type: Boolean,
      default: false,
    },

    // --- Presence ---
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // Multiple active socket connections per user (multi-tab / multi-device support).
    socketIds: {
      type: [String],
      default: [],
    },

    // --- Social ---
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    contacts: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // --- Per-user chat preferences ---
    mutedChats: {
      type: [mutedChatSchema],
      default: [],
    },
    pinnedChats: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
  },
  { timestamps: true },
);

userSchema.index({ username: "text", displayName: "text" });
userSchema.index({ unverifiedAccountExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash the password before saving, but only when it was actually modified
// (avoids re-hashing an already-hashed password on unrelated profile updates).
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// Never send the password hash (or the raw socketIds list) to the frontend.
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject({ virtuals: false });
  delete obj.password;
  delete obj.socketIds;
  delete obj.emailVerificationOtpHash;
  delete obj.emailVerificationExpiresAt;
  delete obj.emailVerificationAttempts;
  delete obj.emailVerificationLastSentAt;
  delete obj.verificationSessionTokenHash;
  delete obj.verificationSessionTokenExpiresAt;
  delete obj.unverifiedAccountExpiresAt;
  delete obj.passwordResetOtpHash;
  delete obj.passwordResetExpiresAt;
  delete obj.passwordResetAttempts;
  delete obj.passwordResetLastSentAt;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetTokenExpiresAt;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);
