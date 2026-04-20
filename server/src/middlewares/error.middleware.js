import ApiError from '../utils/apiError.js';

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

export const errorHandler = (err, req, res, next) => {
  if (err?.code === 'ELOGIN') {
    return res.status(500).json({
      success: false,
      message: 'Khong dang nhap duoc SQL Server. Kiem tra Windows Authentication va connection string.'
    });
  }

  if (err?.code === 'EINSTLOOKUP' || err?.code === 'ESOCKET' || err?.code === 'ETIMEOUT') {
    return res.status(500).json({
      success: false,
      message: 'Khong ket noi duoc SQL Server instance. Kiem tra Server name va SQL Server Browser/TCP-IP.'
    });
  }

  if (err?.code === 'EREQUEST') {
    return res.status(400).json({
      success: false,
      message: err.message || 'SQL Server request error.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
