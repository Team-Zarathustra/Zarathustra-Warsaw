import express from "express";
import { logger } from '../logger/logger.js';
import rateLimit from 'express-rate-limit';

import authRoutes from './auth.js';
import userRoutes from './user.js';
import fieldReportRoutes from './humintRoutes.js';
import signalIntelligenceRoutes from './sigintRoutes.js';
import fusionRoutes from './fusionRoutes.js';

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/field-reports', fieldReportRoutes);
router.use('/signal-intelligence', signalIntelligenceRoutes);
router.use('/fusion', fusionRoutes);

router.get('/intelligence/limits', (req, res) => {
  res.json({
    limit: 10,
    used: 0,
    remaining: 10,
    resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    isAuthenticated: true,
    planType: 'standard',
    upgradeAvailable: false
  });
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

router.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const errorResponse = {
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  };

  if (!res.headersSent) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json(errorResponse);
  }
});

export default router;