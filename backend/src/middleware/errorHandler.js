import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || 50;
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum allowed size is ${maxMb}MB per file.`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      const maxCount = process.env.MAX_FILES_COUNT || 10;
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum allowed is ${maxCount} files per upload session.`
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  // Custom validation or file filter error
  if (err.message && err.message.includes('restricted for security reasons')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Path traversal or illegal path errors
  if (err.message && err.message.includes('Access denied')) {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
}
