import fs from 'fs-extra';
import path from 'path';

export async function generateScheduledTasks(srcDir: string): Promise<void> {
  const tasksDir = path.join(srcDir, 'tasks');
  await fs.ensureDir(tasksDir);

  const tasksContent = `import cron from 'node-cron';
import { logger } from '../utils/logger.js';

/**
 * Register all scheduled tasks
 */
export function registerScheduledTasks() {
  // Example: Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily cleanup task...');
    // Add your cleanup logic here
    // Example: Delete old sessions, clean up expired tokens, etc.
  });

  // Example: Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly task...');
    // Add your hourly logic here
  });

  // Example: Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running 5-minute task...');
    // Add your frequent task logic here
  });

  logger.info('Scheduled tasks registered');
}

/**
 * Task examples (uncomment and customize as needed):
 * 
 * // Daily backup
 * cron.schedule('0 2 * * *', async () => {
 *   await backupDatabase();
 * });
 * 
 * // Weekly report
 * cron.schedule('0 9 * * 1', async () => {
 *   await generateWeeklyReport();
 * });
 * 
 * // Clean expired sessions every hour
 * cron.schedule('0 * * * *', async () => {
 *   await cleanExpiredSessions();
 * });
 */
`;

  await fs.writeFile(path.join(tasksDir, 'index.ts'), tasksContent);
}
