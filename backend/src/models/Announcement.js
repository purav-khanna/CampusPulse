import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  authorId: { type: Number }
}, { strict: false });

export const Announcement = mongoose.model('Announcement', AnnouncementSchema, 'announcements');
export default Announcement;
