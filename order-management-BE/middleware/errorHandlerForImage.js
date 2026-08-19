// middlewares/errorHandlerForImage.js

const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  // Multer-specific error
  if (err instanceof multer.MulterError) {
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size is 2MB.';
    }

    return res.status(400).json({
      status_code: 400,
      status: 'fail',
      message,
    });
  }

  // Custom error thrown in fileFilter
  if (err.message === 'Only jpeg, jpg, png files are allowed') {
    return res.status(400).json({
      status_code: 400,
      status: 'fail',
      message: err.message,
    });
  }

  // Other errors
  res.status(500).json({
    status_code: 500,
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
