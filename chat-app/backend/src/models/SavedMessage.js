import mongoose, { Schema } from 'mongoose';

const savedMessageSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
}, { timestamps: true });
savedMessageSchema.index({ user: 1, message: 1 }, { unique: true });
export default mongoose.model('SavedMessage', savedMessageSchema);