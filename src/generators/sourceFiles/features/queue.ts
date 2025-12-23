import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateQueueSystem(
  queueDir: string,
  routesDir: string,
  config: ProjectConfig
): Promise<void> {
  // Queue configuration
  const queueConfigContent = `import Bull from 'bull';
import { redis } from '../config/redis.js';
import { config as envConfig } from '../config/env.js';

export const createQueue = (name: string) => {
  return new Bull(name, {
    redis: {
      host: envConfig.REDIS_HOST,
      port: envConfig.REDIS_PORT,
      password: envConfig.REDIS_PASSWORD || undefined,
      db: envConfig.REDIS_DB,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
};

// Export queues
export const emailQueue = createQueue('email');
export const notificationQueue = createQueue('notification');
`;

  await fs.writeFile(path.join(queueDir, 'config.ts'), queueConfigContent);

  // Queue workers
  const queueWorkersContent = `import { emailQueue, notificationQueue } from './config.js';
import { logger } from '../utils/logger.js';
${config.includeAuth ? `import { emailService } from '../services/email.service.js';` : ''}

export const startQueueWorkers = () => {
  // Email queue worker
  emailQueue.process(async (job) => {
    logger.info(\`Processing email job \${job.id}\`);
    const { to, subject, html, text } = job.data;
    
    ${config.includeAuth ? `try {
      await emailService.sendEmail(to, subject, html, text);
      logger.info(\`Email sent successfully to \${to}\`);
    } catch (error) {
      logger.error(\`Error sending email:\`, error);
      throw error;
    }` : `// Email service not available
    logger.warn('Email service not configured');`}
  });

  emailQueue.on('completed', (job) => {
    logger.info(\`Email job \${job.id} completed\`);
  });

  emailQueue.on('failed', (job, err) => {
    logger.error(\`Email job \${job.id} failed:\`, err);
  });

  // Notification queue worker
  notificationQueue.process(async (job) => {
    logger.info(\`Processing notification job \${job.id}\`);
    const { userId, message, type } = job.data;
    
    // Implement your notification logic here
    logger.info(\`Notification sent to user \${userId}: \${message}\`);
  });

  notificationQueue.on('completed', (job) => {
    logger.info(\`Notification job \${job.id} completed\`);
  });

  notificationQueue.on('failed', (job, err) => {
    logger.error(\`Notification job \${job.id} failed:\`, err);
  });

  logger.info('Queue workers started');
};
`;

  await fs.writeFile(path.join(queueDir, 'workers.ts'), queueWorkersContent);

  // Queue service
  const queueServiceContent = `import { emailQueue, notificationQueue } from './config.js';
import { logger } from '../utils/logger.js';

export interface EmailJobData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface NotificationJobData {
  userId: string;
  message: string;
  type?: string;
}

export const queueService = {
  async addEmailJob(data: EmailJobData) {
    try {
      const job = await emailQueue.add(data, {
        priority: 1,
      });
      logger.info(\`Email job \${job.id} added to queue\`);
      return job;
    } catch (error) {
      logger.error('Error adding email job:', error);
      throw error;
    }
  },

  async addNotificationJob(data: NotificationJobData) {
    try {
      const job = await notificationQueue.add(data, {
        priority: 1,
      });
      logger.info(\`Notification job \${job.id} added to queue\`);
      return job;
    } catch (error) {
      logger.error('Error adding notification job:', error);
      throw error;
    }
  },

  async getQueueStats() {
    try {
      const [emailStats, notificationStats] = await Promise.all([
        emailQueue.getJobCounts(),
        notificationQueue.getJobCounts(),
      ]);

      return {
        email: emailStats,
        notification: notificationStats,
      };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  },
};
`;

  await fs.writeFile(path.join(queueDir, 'service.ts'), queueServiceContent);

  // Queue dashboard
  const queueDashboardContent = `import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue, notificationQueue } from './config.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(emailQueue), new BullAdapter(notificationQueue)],
  serverAdapter,
});

export const queueDashboardRouter = express.Router();
queueDashboardRouter.use('/', serverAdapter.getRouter());
`;

  await fs.writeFile(path.join(queueDir, 'dashboard.ts'), queueDashboardContent);

  // Queue routes
  const queueRoutesContent = `import { Router } from 'express';
import { queueService } from '../queue/service.js';
${config.includeAuth ? `import { authenticate } from '../middlewares/auth.js';` : ''}

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Queue
 *   description: Queue management endpoints
 */

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics
 */
${config.includeAuth ? `router.get('/stats', authenticate, async (req, res) => {` : `router.get('/stats', async (req, res) => {`}
  try {
    const stats = await queueService.getQueueStats();
    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get queue stats',
    });
  }
});

export { router as queueRoutes };
`;

  await fs.writeFile(path.join(routesDir, 'queue.routes.ts'), queueRoutesContent);
}

