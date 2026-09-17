const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function invalid(res, message) {
  return res.status(400).json({ message });
}

/** Validate registration input before it reaches the controller/database. */
export function validateRegistration(req, res, next) {
  const { username, email, password, displayName } = req.body || {};

  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
    return invalid(res, 'Username must be between 3 and 30 characters.');
  }
  if (!USERNAME_PATTERN.test(username.trim())) {
    return invalid(res, 'Username may contain only letters, numbers, and underscores.');
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return invalid(res, 'Please provide a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return invalid(res, 'Password must be between 8 and 128 characters.');
  }
  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.trim().length > 50)) {
    return invalid(res, 'Display name must be 50 characters or fewer.');
  }

  return next();
}


/** Validate email OTP verification and resend requests. */
export function validateEmailVerification(req, res, next) {
  const { email, otp } = req.body || {};
  if (Object.keys(req.body || {}).some((field) => !['email', 'otp'].includes(field))
    || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())
    || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return invalid(res, 'Provide a valid email address and 6-digit verification code.');
  }
  return next();
}

export function validateVerificationResend(req, res, next) {
  const { email } = req.body || {};
  if (Object.keys(req.body || {}).some((field) => field !== 'email')
    || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return invalid(res, 'Provide a valid email address.');
  }
  return next();
}

/** A pending registrant may correct their email only with their short-lived registration session. */
export function validateUnverifiedEmailChange(req, res, next) {
  const { email, newEmail, verificationSessionToken } = req.body || {};
  if (Object.keys(req.body || {}).some((field) => !['email', 'newEmail', 'verificationSessionToken'].includes(field))
    || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())
    || typeof newEmail !== 'string' || !EMAIL_PATTERN.test(newEmail.trim())
    || typeof verificationSessionToken !== 'string' || !/^[a-f\d]{64}$/i.test(verificationSessionToken)) {
    return invalid(res, 'Provide your current email, a valid new email address, and registration session.');
  }
  return next();
}

export function validatePasswordReset(req, res, next) {
  const { email, resetToken, newPassword } = req.body || {};
  if (Object.keys(req.body || {}).some((field) => !['email', 'resetToken', 'newPassword'].includes(field))
    || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())
    || typeof resetToken !== 'string' || !/^[a-f\d]{64}$/i.test(resetToken)
    || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    return invalid(res, 'Provide a valid email, reset session, and password between 8 and 128 characters.');
  }
  return next();
}
/** Validate login input without revealing whether the account exists. */
export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) || typeof password !== 'string' || !password) {
    return invalid(res, 'Email and password are required.');
  }

  return next();
}

/**
 * Require the existing password plus a new password that follows the same
 * length rules used during registration.
 */
export function validatePasswordChange(req, res, next) {
  const { currentPassword, newPassword } = req.body || {};

  if (typeof currentPassword !== 'string' || !currentPassword) {
    return invalid(res, 'Current password is required.');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    return invalid(res, 'New password must be between 8 and 128 characters.');
  }
  if (currentPassword === newPassword) {
    return invalid(res, 'New password must be different from the current password.');
  }

  return next();
}

/** Only displayName belongs in the basic profile-update endpoint. */
export function validateProfileUpdate(req, res, next) {
  const body = req.body || {};
  const unsupportedFields = Object.keys(body).filter((field) => field !== 'displayName');

  if (unsupportedFields.length > 0) {
    return invalid(res, 'Only displayName can be updated with this endpoint.');
  }
  if (typeof body.displayName !== 'string' || body.displayName.trim().length > 50) {
    return invalid(res, 'Display name must be 50 characters or fewer.');
  }

  return next();
}

/** Require a short, non-empty user-search phrase. */
export function validateUserSearch(req, res, next) {
  const { query } = req.query || {};

  if (typeof query !== 'string' || query.trim().length < 1 || query.trim().length > 50) {
    return invalid(res, 'Search query must be between 1 and 50 characters.');
  }

  return next();
}

/** Validate optional cursor values used for incremental list loading. */
export function validateMessageCursor(req, res, next) {
  const { cursor } = req.query || {};
  if (cursor !== undefined && (typeof cursor !== 'string' || !OBJECT_ID_PATTERN.test(cursor))) {
    return invalid(res, 'cursor must be a valid message ID.');
  }
  return next();
}

export function validateUserCursor(req, res, next) {
  const { cursor } = req.query || {};
  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 200)) {
    return invalid(res, 'cursor must be a valid user cursor.');
  }
  return next();
}

export function validateUserId(req, res, next) {
  if (!OBJECT_ID_PATTERN.test(req.params.userId)) {
    return invalid(res, 'A valid user ID is required.');
  }
  return next();
}

/** A direct chat only accepts the selected recipient's MongoDB ID. */
export function validateDirectChat(req, res, next) {
  const body = req.body || {};
  const unsupportedFields = Object.keys(body).filter((field) => field !== 'recipientId');

  if (unsupportedFields.length > 0 || typeof body.recipientId !== 'string' || !OBJECT_ID_PATTERN.test(body.recipientId)) {
    return invalid(res, 'A valid recipientId is required.');
  }

  return next();
}

export function validateGroupChat(req, res, next) {
  const body = req.body || {};
  const allowedFields = ['name', 'memberIds'];

  if (Object.keys(body).some((field) => !allowedFields.includes(field))
    || typeof body.name !== 'string'
    || body.name.trim().length < 3
    || body.name.trim().length > 100
    || !Array.isArray(body.memberIds)
    || body.memberIds.length < 1
    || body.memberIds.length > 99
    || body.memberIds.some((userId) => typeof userId !== 'string' || !OBJECT_ID_PATTERN.test(userId))
    || new Set(body.memberIds).size !== body.memberIds.length) {
    return invalid(res, 'Provide a group name and between 1 and 99 unique member IDs.');
  }

  return next();
}

export function validateGroupMember(req, res, next) {
  const userId = req.params.userId || req.body?.userId;
  if (!OBJECT_ID_PATTERN.test(req.params.chatId) || typeof userId !== 'string' || !OBJECT_ID_PATTERN.test(userId)) {
    return invalid(res, 'A valid chatId and userId are required.');
  }
  return next();
}

export function validateGroupMemberRole(req, res, next) {
  if (!OBJECT_ID_PATTERN.test(req.params.chatId)
    || !OBJECT_ID_PATTERN.test(req.params.userId)
    || !['admin', 'member'].includes(req.body?.role)
    || Object.keys(req.body || {}).some((field) => field !== 'role')) {
    return invalid(res, 'Provide a valid chatId, userId, and role (admin or member).');
  }
  return next();
}

export function validateGroupUpdate(req, res, next) {
  const body = req.body || {};
  const allowedFields = ['name', 'description'];
  const hasUnsupportedField = Object.keys(body).some((field) => !allowedFields.includes(field));

  if (!OBJECT_ID_PATTERN.test(req.params.chatId)
    || hasUnsupportedField
    || Object.keys(body).length === 0
    || (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 3 || body.name.trim().length > 100))
    || (body.description !== undefined && (typeof body.description !== 'string' || body.description.trim().length > 300))) {
    return invalid(res, 'Provide a group name (3-100 characters) or description (up to 300 characters).');
  }
  return next();
}

export function validateCatchUpSummary(req, res, next) {
  const messageIds = req.body?.messageIds;

  if (!Array.isArray(messageIds)
    || messageIds.length > 100
    || messageIds.some((messageId) => typeof messageId !== 'string' || !OBJECT_ID_PATTERN.test(messageId))
    || new Set(messageIds).size !== messageIds.length
    || Object.keys(req.body || {}).some((field) => field !== 'messageIds')) {
    return invalid(res, 'Provide up to 100 unique message IDs for the catch-up summary.');
  }
  return next();
}

export function validateConversationMemorySearch(req, res, next) {
  const query = req.body?.query;
  if (Object.keys(req.body || {}).some((field) => field !== 'query')
    || typeof query !== 'string'
    || query.trim().length < 3
    || query.trim().length > 500) {
    return invalid(res, 'Ask a conversation-memory question between 3 and 500 characters.');
  }
  return next();
}

export function validateDecisionSearch(req, res, next) {
  const query = req.body?.query;
  if (Object.keys(req.body || {}).some((field) => field !== 'query')
    || (query !== undefined && (typeof query !== 'string' || query.trim().length < 3 || query.trim().length > 500))) {
    return invalid(res, 'Decision question must be between 3 and 500 characters.');
  }
  return next();
}

export function validateMessageAiTool(req, res, next) {
  const { mode, recentContext, selectedMessage, targetLanguage } = req.body || {};
  if (!['translate', 'explain_simply', 'explain_task', 'break_into_steps', 'draft_reply'].includes(mode)
    || typeof selectedMessage !== 'string' || !selectedMessage.trim() || selectedMessage.trim().length > 5_000
    || (recentContext !== undefined && (!Array.isArray(recentContext) || recentContext.length > 8 || recentContext.some((message) => typeof message !== 'string' || message.length > 2_000)))
    || (targetLanguage !== undefined && (typeof targetLanguage !== 'string' || targetLanguage.trim().length > 50))
    || Object.keys(req.body || {}).some((field) => !['mode', 'recentContext', 'selectedMessage', 'targetLanguage'].includes(field))) {
    return invalid(res, 'Provide a valid AI mode, selected message, recent context, and optional target language.');
  }
  return next();
}

/** Require a valid chat ID in a message route URL. */
export function validateChatId(req, res, next) {
  if (!OBJECT_ID_PATTERN.test(req.params.chatId)) {
    return invalid(res, 'A valid chatId is required.');
  }

  return next();
}

/** Text messages are kept small and do not accept arbitrary document fields. */
export function validateTextMessage(req, res, next) {
  const body = req.body || {};
  const unsupportedFields = Object.keys(body).filter((field) => !['text', 'replyTo'].includes(field));

  if (unsupportedFields.length > 0 || typeof body.text !== 'string' || !body.text.trim() || body.text.trim().length > 2000
    || (body.replyTo !== undefined && (typeof body.replyTo !== 'string' || !OBJECT_ID_PATTERN.test(body.replyTo)))) {
    return invalid(res, 'Message text must be between 1 and 2000 characters.');
  }

  return next();
}

/** Editing uses the same safe text rules as creating a text message. */
export function validateMessageEdit(req, res, next) {
  const body = req.body || {};
  if (Object.keys(body).some((field) => field !== 'text')
    || typeof body.text !== 'string'
    || !body.text.trim()
    || body.text.trim().length > 2000) {
    return invalid(res, 'Edited message text must be between 1 and 2000 characters.');
  }
  return next();
}

/** Media must be metadata returned by the authenticated ImageKit upload flow. */
export function validateMediaMessage(req, res, next) {
  const media = req.body?.media;
  const allowedFields = ['media', 'replyTo'];
  const imageKitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

  if (Object.keys(req.body || {}).some((field) => !allowedFields.includes(field))
    || !media
    || !['image', 'video', 'file'].includes(media.mediaType)
    || typeof media.url !== 'string'
    || !media.url.startsWith('https://')
    || (imageKitEndpoint && !media.url.startsWith(imageKitEndpoint))
    || typeof media.fileId !== 'string'
    || typeof media.fileName !== 'string'
    || typeof media.mimeType !== 'string'
    || !Number.isFinite(media.sizeBytes)) {
    return invalid(res, 'Valid image, video, or document metadata is required.');
  }

  if (req.body.replyTo !== undefined && (typeof req.body.replyTo !== 'string' || !OBJECT_ID_PATTERN.test(req.body.replyTo))) {
    return invalid(res, 'replyTo must be a valid message ID.');
  }

  return next();
}

export function validateMessageId(req, res, next) {
  if (!OBJECT_ID_PATTERN.test(req.params.messageId)) {
    return invalid(res, 'A valid messageId is required.');
  }

  return next();
}

export function validateMessageDeletion(req, res, next) {
  if (!['me', 'everyone'].includes(req.body?.scope)
    || Object.keys(req.body || {}).some((field) => field !== 'scope')) {
    return invalid(res, 'Deletion scope must be "me" or "everyone".');
  }

  return next();
}

export function validateReaction(req, res, next) {
  const allowedEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  if (Object.keys(req.body || {}).length !== 1 || !allowedEmojis.includes(req.body?.emoji)) {
    return invalid(res, 'Please choose a supported reaction emoji.');
  }

  return next();
}
