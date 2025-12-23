import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateConfigFiles(configDir: string, config: ProjectConfig): Promise<void> {
  // env.ts
  const envContent = `import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
${config.includeAuth ? `  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_SECURE: z.coerce.boolean().default(false),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@coreback.app'),
  APP_URL: z.string().default('http://localhost:3000'),` : ''}${config.includeFileUpload ? `
  MAX_FILE_SIZE: z.coerce.number().default(5242880),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  UPLOAD_DIR: z.string().default('uploads'),${config.fileStorage === 's3' ? `
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),` : ''}` : ''}${config.includeRedis ? `
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),` : ''}
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export const config = envSchema.parse(process.env);
`;

  await fs.writeFile(path.join(configDir, 'env.ts'), envContent);

  // database.ts
  const databaseContent = `import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

export { prisma };
`;

  await fs.writeFile(path.join(configDir, 'database.ts'), databaseContent);

  // middlewares.ts
  const middlewaresContent = `import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './env.js';

export function setupMiddlewares(app: Express): void {
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/', limiter);
}
`;

  await fs.writeFile(path.join(configDir, 'middlewares.ts'), middlewaresContent);

  // swagger.ts
  const swaggerContent = `import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CoreBack API',
      version: '1.0.0',
      description: 'Production-ready backend API',
    },
    servers: [
      {
        url: \`http://localhost:\\\${config.PORT}\`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
`;

  await fs.writeFile(path.join(configDir, 'swagger.ts'), swaggerContent);

  if (config.includeRedis) {
    // redis.ts
    const redisContent = `import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  db: config.REDIS_DB,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

export { redis };
`;

    await fs.writeFile(path.join(configDir, 'redis.ts'), redisContent);
  }
}
