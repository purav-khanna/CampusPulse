import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  role: { type: String },
  passwordHash: { type: String }
}, { strict: false });

export const User = mongoose.model('User', UserSchema, 'users');
export default User;
