import bcrypt from 'bcryptjs';
import ApiError from '../utils/apiError.js';
import { signJwt } from '../utils/jwt.js';
import { createUser, findUserByEmail } from '../models/user.model.js';
import { findLatestAvatarByUserId } from '../models/avatar.model.js';

const mapAuthResponse = (user, avatarUrl = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  tokenVersion: user.tokenVersion,
  avatarUrl,
  role: user.role
});

const buildAuthPayload = async (user) => {
  const latestAvatar = await findLatestAvatarByUserId(user.id);
  const avatarUrl = latestAvatar?.imageUrl || null;
  const token = signJwt({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion || 0 });

  return {
    user: mapAuthResponse(user, avatarUrl),
    token
  };
};

export const registerUser = async ({ name, email, password }) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = 'SALES'; // Default role for new users
  const user = await createUser({ name, email, password: hashed, role });
  return buildAuthPayload(user);
};

export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return buildAuthPayload(user);
};
