import asyncHandler from '../utils/asyncHandler.js';
import { askChatAssistant } from '../services/chat.service.js';

export const askChatHandler = asyncHandler(async (req, res) => {
  const data = await askChatAssistant(req.validated?.body || req.body);
  res.status(200).json({ success: true, data });
});
