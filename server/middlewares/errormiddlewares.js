class ErrorHandler extends Error {
  constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // MySQL specific error handling
  if (err.code === 'ER_DUP_ENTRY') {
      err = new ErrorHandler("Duplicate entry found", 400);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW') {
      err = new ErrorHandler("Referenced record not found", 400);
  }
  if (err.code === 'ER_BAD_FIELD_ERROR') {
      err = new ErrorHandler("Invalid field in database query", 400);
  }
  if (err.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      err = new ErrorHandler("Missing required field", 400);
  }
  if (err.code === 'ER_DATA_TOO_LONG') {
      err = new ErrorHandler("Data too long for field", 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
      err = new ErrorHandler('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
      err = new ErrorHandler('Token expired. Please log in again.', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(value => value.message).join(', ');
      err = new ErrorHandler(message, 400);
  }

  // Cast errors
  if (err.name === 'CastError') {
      err = new ErrorHandler('Invalid data format', 400);
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
      err = new ErrorHandler('Database connection failed', 503);
  }

  // Final error response
  res.status(err.statusCode).json({
      success: false,
      message: err.message,
  });

};

export default ErrorHandler;