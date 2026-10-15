import rateLimit from 'express-rate-limit';

// Global API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Stricter rate limit for file uploads to prevent storage abuse
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 uploads per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload limit reached. You can only create 30 sharing sessions per 15 minutes.'
  }
});

// Download rate limit
export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120, // 120 downloads per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Download rate limit reached. Please try again later.'
  }
});
