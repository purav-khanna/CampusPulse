import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  title: { type: String },
  message: { type: String }
}, { strict: false });

export const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');
export default Notification;
