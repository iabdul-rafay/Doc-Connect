/**
 * middleware/errorMiddleware.js
 * A small operational-error class, an async wrapper to forward rejections,
 * and a global error handler that returns consistent JSON.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Wrap async controllers so thrown/rejected errors reach the handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFound(req, _res, next) {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong on our end.';

  // Friendlier messages for common Mongoose errors.
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use.`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier provided.';
  }

  if (status >= 500) console.error('✖ ', err);

  res.status(status).json({ success: false, message });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };
