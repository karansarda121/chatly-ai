import mongoose, { Schema } from 'mongoose';

/**
 * Populated only when type is 'image' | 'video' | 'file'.
 * Values are returned by ImageKit. `fileId` is retained so the asset can be
 * deleted from ImageKit when a message is deleted for everyone.
 */
const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    fileId: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video', 'file'], required: true },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const reactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'system'],
      default: 'text',
    },

    text: {
      type: String,
      trim: true,
      default: '',
    },
    media: {
      type: mediaSchema,
      default: null,
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    forwardedFrom: {
      message: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
      sender: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },

    // A real mention is stored as a User ID. The visible @username in text is
    // convenient for people; this array is the reliable data used by alerts
    // and AI follow-up features.
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // --- Delivery / read tracking ---
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // --- Deletion ---
    // Per-user soft delete: users in this list no longer see the message
    // (but it still exists for everyone else).
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Sender-initiated "delete for everyone" - message content is blanked
    // out and, if it had media, the ImageKit asset is destroyed too.
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // True only for the assistant's own reply messages, and only ever set
    // inside a user's private assistant chat (see Chat.isAssistantChat).
    isAI: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    reactions: {
      type: [reactionSchema],
      default: [],
    },

    // Created lazily when Conversation Memory first searches this message.
    // Kept out of normal API responses because vectors are large internal data.
    embedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    embeddingModel: {
      type: String,
      default: '',
      select: false,
    },
  },
  { timestamps: true }
);

// Paginated chat history is the hottest query in the app.
messageSchema.index({ chat: 1, createdAt: -1 });
// Backs the "search messages by text within a chat" endpoint.
messageSchema.index({ chat: 1, text: 'text' });

export default mongoose.model('Message', messageSchema);
