import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  messageId: { type: Number, required: true, unique: true },
  conversationId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.Mixed },
  receiverId: { type: mongoose.Schema.Types.Mixed },
  message: { type: String },
  text: { type: String }
}, { strict: false });

export const Chat = mongoose.model('Chat', ChatSchema, 'messages');
export default Chat;
