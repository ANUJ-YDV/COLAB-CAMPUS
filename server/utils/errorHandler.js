// server/utils/errorHandler.js
/**
 * Centralized error handler for Mongoose and application errors
 * Converts Mongoose errors into user-friendly HTTP responses
 */

/**
 * Handle Mongoose validation errors
 */
function handleValidationError(err, res) {
  const errors = {};
  Object.keys(err.errors).forEach((key) => {
    errors[key] = err.errors[key].message;
  });

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

/**
 * Handle Mongoose duplicate key errors (11000)
 */
function handleDuplicateKeyError(err, res) {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  return res.status(409).json({
    success: false,
    message: `${field} '${value}' already exists`,
    field,
  });
}

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
function handleCastError(err, res) {
  return res.status(400).json({
    success: false,
    message: `Invalid ${err.path}: ${err.value}`,
  });
}

/**
 * Main error handler - routes errors to appropriate handler
 */
export function handleMongooseError(err, res) {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return handleValidationError(err, res);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return handleDuplicateKeyError(err, res);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return handleCastError(err, res);
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

/**
 * Validate required fields before processing
 */
export function validateRequired(fields, body, res) {
  const missing = [];

  fields.forEach((field) => {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields',
      missing,
    });
    return false;
  }

  return true;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

export default {
  handleMongooseError,
  validateRequired,
  validateEmail,
  validatePassword,
};
