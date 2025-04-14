import { logger } from '../logger/logger.js';
import pg from 'pg'
const { Pool } = pg

const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: dbPassword,
  database: process.env.DB_NAME,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false,
  ssl: false,
  types: undefined
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
});

export const queryWithRetry = async (sql, params, connection = undefined, maxRetries = 3) => {
  let retries = 0;
  let lastError;

  while (retries <= maxRetries) {
    try {
      const results = connection
        ? await connection.query(sql, params)
        : await pool.query(sql, params);
      
      return results.rows || [];
    } catch (error) {
      lastError = error;
      
      if (
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === '57P01' ||
        error.code === '08006' ||
        error.code === '08001' ||
        error.code === '08004'
      ) {
        retries++;
        const delay = Math.min(100 * Math.pow(2, retries), 10000);
        
        logger.warn(`Database connection error, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, {
          error: error.message,
          code: error.code
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  logger.error('Database query error after maximum retries', {
    sql: sql.replace(/\s+/g, ' '),
    error: lastError.message,
    code: lastError.code,
    stack: lastError.stack
  });
  
  throw lastError;
};

export const query = async (sql, params, connection = undefined) => {
  try {
    const log = {
      sql: sql.trim().replace(/\s+/g, ' '),
      params
    };

    const skip = false;

    if(skip) {
      logger.debug('Executing query: ' + JSON.stringify(log));
    } else {
      logger.info('Executing query: ' + JSON.stringify(log).replace(/\\"/g, "'"));
    }

    const results = await queryWithRetry(sql, params, connection);

    if (Array.isArray(results)) {
      logger.debug('Returning query results: ' + JSON.stringify({
        rowCount: results.length,
        firstRow: results[0]
      }));

      if(!skip && results.length !== null) {
        logger.info('Returning row count: ' + results.length);
      } else {
        logger.debug(JSON.stringify(results))
      }

      return results;
    }

    return [];

  } catch (error) {
    logger.error('Database query error: ' + JSON.stringify({
      sql: sql.replace(/\s+/g, ' '),
      error: error.message,
      code: error.code,
      stack: error.stack
    }));
    throw error;
  }
}

export const testConnectionWithRetry = async (maxRetries = 5) => {
  let retries = 0;
  let connected = false;
  
  while (!connected && retries <= maxRetries) {
    try {
      await query('SELECT 1');
      connected = true;
      if (retries > 0) {
        logger.info(`Successfully reconnected to database after ${retries} attempts`);
      }
      return true;
    } catch (error) {
      retries++;
      const delay = Math.min(1000 * Math.pow(2, retries), 60000);
      
      logger.error(`Database connection check failed, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, {
        error: error.message,
        code: error.code
      });
      
      if (retries <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (!connected) {
    logger.error(`Failed to connect to database after ${maxRetries} attempts`);
    return false;
  }
}

export const transaction = async (callback, errorLogPrefix = 'Transaction error: ') => {
  let client;
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      client = await pool.connect();
      
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error('Error rolling back transaction', { error: rollbackError.message });
        }
      }
      
      if (
        (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === '57P01' ||
        error.code === '08006' ||
        error.code === '08001' ||
        error.code === '08004') &&
        retries < maxRetries
      ) {
        retries++;
        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        logger.warn(`Database transaction error, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, {
          error: error.message,
          code: error.code
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(errorLogPrefix + JSON.stringify(error));
        throw error;
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  }
};

export const testConnection = async () => {
  return await query('SELECT 1');
}

export const initializeDatabase = async () => {
  try {
    logger.info('Starting optional database reset and initialization...');

    await query("SET session_replication_role = 'replica'");

    if (process.env.DROP_DB_AT_START === 'true') {
      logger.info('Dropping existing tables...');
    
      await query('DROP TABLE IF EXISTS account CASCADE');
    
      logger.info('All existing tables dropped successfully.');
    }

    await query("SET session_replication_role = 'origin'");

    await query(`
      CREATE TABLE IF NOT EXISTS account (
        account_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      )
    `);

    await query("SET session_replication_role = 'origin'");

    logger.info('Database schema initialized successfully');

  } catch (error) {
    await query("SET session_replication_role = 'origin'");
    logger.error('Error initializing database schema: ' + JSON.stringify(error));
    throw error;
  }
}