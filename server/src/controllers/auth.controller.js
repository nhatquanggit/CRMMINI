import asyncHandler from '../utils/asyncHandler.js';
import { loginUser, registerUser } from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.validated.body);
  res.status(201).json({ success: true, message: 'Register successful', data: result });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.validated.body);
  res.status(200).json({ success: true, message: 'Login successful', data: result });
});
