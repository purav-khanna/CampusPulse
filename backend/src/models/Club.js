import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  leaderId: { type: Number },
  ownerId: { type: Number }
}, { strict: false });

export const Club = mongoose.model('Club', ClubSchema, 'clubs');
export default Club;
