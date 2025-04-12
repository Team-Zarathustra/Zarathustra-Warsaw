import jwt from "jsonwebtoken";
import { logger } from '../api/logger/logger.js';
import { JWT_SECRET } from "../../config.js";


export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = { 
        userId: decoded.userId,
        id: decoded.userId,
        email: decoded.email
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Token verification failed' });
    }
  } catch (error) {
    logger.error('Authentication error: ' + JSON.stringify(error));
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
