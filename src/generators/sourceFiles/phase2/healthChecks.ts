import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateAdvancedHealthChecks(
  controllersDir: string,
  config: ProjectConfig
): Promise<void> {
  const healthControllerContent = `import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
${config.includeRedis ? `import { redis } from '../config/redis.js';` : ''}
import { logger } from '../utils/logger.js';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

export const healthController = {
  check: async (_req: Request, res: Response) => {
    const checks: HealthCheck[] = [];
    let overallStatus = 'healthy';

    // Database check
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw\`SELECT 1\`;
      const dbTime = Date.now() - dbStart;
      checks.push({
        name: 'database',
        status: 'healthy',
        responseTime: dbTime,
      });
    } catch (error) {
      overallStatus = 'unhealthy';
      checks.push({
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
      });
      logger.error('Database health check failed:', error);
    }

${config.includeRedis ? `    // Redis check
    try {
      const redisStart = Date.now();
      await redis.ping();
      const redisTime = Date.now() - redisStart;
      checks.push({
        name: 'redis',
        status: 'healthy',
        responseTime: redisTime,
      });
    } catch (error) {
      overallStatus = 'unhealthy';
      checks.push({
        name: 'redis',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis connection failed',
      });
      logger.error('Redis health check failed:', error);
    }
` : ''}
    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    });
  },
};
`;

  await fs.writeFile(
    path.join(controllersDir, 'health.controller.ts'),
    healthControllerContent
  );
}
