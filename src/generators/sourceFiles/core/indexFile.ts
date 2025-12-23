import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateIndex(srcDir: string, config: ProjectConfig): Promise<void> {
  const indexContent = `import express from 'express';
import { config } from './config/env.js';
import { setupMiddlewares } from './config/middlewares.js';
import { setupRoutes } from './routes/index.js';
import { setupSwagger } from './config/swagger.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { registerListeners } from './events/listeners/index.js';
import { registerScheduledTasks } from './tasks/index.js';${config.includeRedis ? `
import { redis } from './config/redis.js';` : ''}${config.includeQueue ? `
import { startQueueWorkers } from './queue/workers.js';` : ''}

const app = express();

setupMiddlewares(app);
setupSwagger(app);
setupRoutes(app);
app.use(errorHandler);

// Register event listeners
registerListeners();

// Register scheduled tasks
registerScheduledTasks();

${config.includeQueue ? `// Start queue workers
startQueueWorkers();` : ''}

const server = app.listen(config.PORT, () => {
  logger.info(\`🚀 Server: http://localhost:\${config.PORT}\`);
  logger.info(\`📚 Docs: http://localhost:\${config.PORT}/api-docs\`);${config.includeQueue ? `
  logger.info(\`📊 Queue Dashboard: http://localhost:\${config.PORT}/admin/queues\`);` : ''}
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close();
  ${config.includeRedis ? `await redis.quit();` : ''}
  process.exit(0);
});
`;

  await fs.writeFile(path.join(srcDir, 'index.ts'), indexContent);
}
