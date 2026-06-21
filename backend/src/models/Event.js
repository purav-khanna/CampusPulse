import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  creatorId: { type: Number }
}, { strict: false });

export const Event = mongoose.model('Event', EventSchema, 'events');
export default Event;
