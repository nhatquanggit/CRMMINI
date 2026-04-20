import { verifyJwt } from '../utils/jwt.js';
import ApiError from '../utils/apiError.js';
import { findUserById } from '../models/user.model.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  try {
    const decoded = verifyJwt(token);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return next(new ApiError(401, 'Invalid token user'));
    }

    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return next(new ApiError(401, 'Session is no longer valid'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  return next();
};
