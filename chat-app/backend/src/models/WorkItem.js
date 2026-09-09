import mongoose, { Schema } from 'mongoose';

const workItemSchema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  sourceMessage: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
  category: { type: String, enum: ['commitment', 'task', 'event'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  ownerName: { type: String, trim: true, maxlength: 80, default: '' },
  dueText: { type: String, trim: true, maxlength: 100, default: '' },
  dueAt: { type: Date, default: null },
  status: { type: String, enum: ['open', 'completed'], default: 'open' },
  completedAt: { type: Date, default: null },
}, { timestamps: true });
workItemSchema.index({ createdBy: 1, status: 1, dueAt: 1 });
export default mongoose.model('WorkItem', workItemSchema);
