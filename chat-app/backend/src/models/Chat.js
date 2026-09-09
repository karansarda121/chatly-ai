import mongoose, { Schema } from 'mongoose';

/**
 * One entry per chat member. Kept as subdocuments (rather than a flat
 * `members: [ObjectId]` array) so we can track a role and a per-member
 * read cursor without a second collection.
 */
const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    // Last message this member has read up to - drives read-receipt / unread-count logic.
    lastReadMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },

    members: {
      type: [memberSchema],
      validate: {
        validator: function (members) {
          if (this.type === 'direct') return members.length === 2;
          return members.length >= 1;
        },
        message: 'A direct chat must have exactly 2 members.',
      },
    },

    // group only
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },


    // Fast-path flag so we don't have to re-derive "is this the AI assistant
    // chat?" by checking membership every time. Set once at creation.
    isAssistantChat: {
      type: Boolean,
      default: false,
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    pinnedMessages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  { timestamps: true }
);

// Speeds up "find all chats this user is a member of", which is the
// sidebar's main query.
chatSchema.index({ 'members.user': 1 });
// Used by the get-or-create direct-chat lookup (feature 2).
chatSchema.index({ type: 1, 'members.user': 1 });

export default mongoose.model('Chat', chatSchema);
