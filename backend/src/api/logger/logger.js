import winston from "winston";
import DailyRotateFile from 'winston-daily-rotate-file';
import { LOGGER_DIRECTORY, LOGGER_LEVEL } from '../../../config.js';

const objectFormatter = winston.format((info) => {
    if (info.message && typeof info.message === 'object') {
        info.message = JSON.stringify(info.message, null, 2);
    }
    
    if (Object.keys(info).length > 3) {
        const additionalInfo = {...info};
        delete additionalInfo.timestamp;
        delete additionalInfo.level;
        delete additionalInfo.message;
        
        info.message = `${info.message} ${JSON.stringify(additionalInfo, null, 2)}`;
    }
    
    return info;
});

export const logger = winston.createLogger({
    level: LOGGER_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({
            format: () => new Date().toISOString().replace('T', ' ').slice(0, 23)
        }),
        winston.format.errors({ stack: true }),
        objectFormatter(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            if (stack) {
                return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
            }
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({
                    format: () => new Date().toISOString().replace('T', ' ').slice(0, 23)
                }),
                objectFormatter(),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    if (stack) {
                        return `[${timestamp}] ${level}: ${message}\n${stack}`;
                    }
                    return `[${timestamp}] ${level}: ${message}`;
                })
            )
        }),
        new DailyRotateFile({
            filename: `${LOGGER_DIRECTORY}/%DATE%.log`,
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true
        })
    ]
});

logger.info('Test info with object', { 
    user: 'test',
    action: 'login',
    details: { ip: '127.0.0.1' }
});

logger.error('Test error with details', {
    error: new Error('Test error'),
    context: {
        user: 'test',
        action: 'process'
    }
});

export const logError = (message, error, additionalInfo = {}) => {
    logger.error({
        message,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error.details && { details: error.details })
        },
        ...additionalInfo
    });
};

try {
    throw new Error('Test error');
} catch (error) {
    logError('Something went wrong', error, { context: 'test' });
}