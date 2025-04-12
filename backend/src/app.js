import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import routes from './api/router/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, testConnection } from "./api/repository/index.js";
import { logger } from './api/logger/logger.js';
import { ALLOWED_ORIGINS, SERVER_HOST, SERVER_PORT } from "../config.js";
import { testConnectionWithRetry } from './api/repository/index.js';
import { clearCache } from './services/cacheService.js';

const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const app = express();

app.set('trust proxy', true);

app.use(cors({
 origin: function(origin, callback) {
   if(!origin) return callback(null, true);
   if(ALLOWED_ORIGINS.indexOf(origin) === -1){
     return callback(new Error('CORS policy violation: ' + origin), false);
   }
   return callback(null, true);
 },
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization'],
 exposedHeaders: ['Content-Type', 'Authorization'],
 credentials: true,
 preflightContinue: false,
 optionsSuccessStatus: 204
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api', routes);
app.options('*', cors());

async function startServer() {
 try {
   try {
     await clearCache();
     logger.info('Cache cleared during startup');
   } catch (error) {
     logger.error('Failed to clear cache during startup', { 
       error: error.message 
     });
   }

   // 1. Database initialization
   await testConnection();
   logger.info('Database connected successfully');
   await initializeDatabase();
   logger.info('Database schema initialized');

   // 2. Start HTTP server
   app.listen(SERVER_PORT, SERVER_HOST, () => {
     logger.info(`Military Intelligence platform is running on port ${SERVER_PORT}`);
   });

   // 3. Set up periodic database health check
   const DB_HEALTH_CHECK_INTERVAL = 60000;
   setInterval(async () => {
     try {
       await testConnectionWithRetry(3);
     } catch (error) {
       logger.error('Database health check failed', { error: error.message });
     }
   }, DB_HEALTH_CHECK_INTERVAL);

   logger.info('Database health check job started');

 } catch (error) {
   logger.error('Fatal error during server startup: ' + JSON.stringify(error));
   process.exit(1);
 }
}

startServer();

export default app;