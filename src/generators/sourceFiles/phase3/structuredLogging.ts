import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateStructuredLogging(
  utilsDir: string,
  config: ProjectConfig
): Promise<void> {
  // Replace the existing logger with structured logging
  const loggingContent = `import winston from 'winston';
import { config as envConfig } from '../config/env.js';
import fs from 'fs-extra';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
fs.ensureDirSync(logsDir);

/**
 * Log channels configuration
 */
const channels = {
  // Application logs
  app: winston.createLogger({
    level: envConfig.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'app.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  }),

  // Error logs
  error: winston.createLogger({
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  }),

  // Access logs (HTTP requests)
  access: winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'access.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  }),

  // Query logs (Database queries)
  query: winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'query.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  }),
};

// Add console transport in development
if (envConfig.NODE_ENV !== 'production') {
  Object.values(channels).forEach((channel) => {
    channel.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  });
}

/**
 * Main logger (default channel: app)
 */
export const logger = channels.app;

/**
 * Channel-specific loggers
 */
export const loggers = {
  app: channels.app,
  error: channels.error,
  access: channels.access,
  query: channels.query,
};

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

/**
 * Structured logging helper
 */
export function log(level: keyof typeof LogLevel, message: string, meta?: any) {
  const channel = level === 'error' ? channels.error : channels.app;
  channel[level](message, meta);
}

/**
 * Access log middleware
 */
export function accessLog(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    channels.access.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: \`\${duration}ms\`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
`;

  await fs.writeFile(path.join(utilsDir, 'logger.ts'), loggingContent);
}
