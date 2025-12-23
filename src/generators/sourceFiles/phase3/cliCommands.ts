import fs from 'fs-extra';
import path from 'path';

export async function generateCLICommands(projectPath: string): Promise<void> {
  const commandsDir = path.join(projectPath, 'scripts', 'commands');
  await fs.ensureDir(commandsDir);

  const commandsIndexContent = `#!/usr/bin/env tsx
import { Command } from 'commander';
import { cacheClearCommand } from './cache-clear.js';
import { dbSeedCommand } from './db-seed.js';
import { queueWorkCommand } from './queue-work.js';

const program = new Command();

program
  .name('coreback')
  .description('CoreBack CLI commands')
  .version('1.0.0');

// Register commands
cacheClearCommand(program);
dbSeedCommand(program);
queueWorkCommand(program);

program.parse();
`;

  await fs.writeFile(path.join(commandsDir, 'index.ts'), commandsIndexContent);

  // Cache clear command
  const cacheClearContent = `import { Command } from 'commander';
import { redis } from '../../src/config/redis.js';
import { logger } from '../../src/utils/logger.js';

export function cacheClearCommand(program: Command) {
  program
    .command('cache:clear')
    .description('Clear all cache')
    .action(async () => {
      try {
        await redis.flushdb();
        logger.info('✅ Cache cleared successfully');
      } catch (error) {
        logger.error('❌ Failed to clear cache:', error);
        process.exit(1);
      }
    });
}
`;

  await fs.writeFile(path.join(commandsDir, 'cache-clear.ts'), cacheClearContent);

  // DB seed command
  const dbSeedContent = `import { Command } from 'commander';
import { execSync } from 'child_process';
import { logger } from '../../src/utils/logger.js';

export function dbSeedCommand(program: Command) {
  program
    .command('db:seed')
    .description('Seed the database')
    .option('-f, --force', 'Force seed even if data exists')
    .action(async (options) => {
      try {
        logger.info('🌱 Seeding database...');
        execSync('tsx prisma/seed.ts', { stdio: 'inherit' });
        logger.info('✅ Database seeded successfully');
      } catch (error) {
        logger.error('❌ Failed to seed database:', error);
        process.exit(1);
      }
    });
}
`;

  await fs.writeFile(path.join(commandsDir, 'db-seed.ts'), dbSeedContent);

  // Queue work command
  const queueWorkContent = `import { Command } from 'commander';
import { startQueueWorkers } from '../../src/queue/workers.js';
import { logger } from '../../src/utils/logger.js';

export function queueWorkCommand(program: Command) {
  program
    .command('queue:work')
    .description('Start queue workers')
    .option('--once', 'Process jobs once and exit')
    .action(async (options) => {
      try {
        logger.info('🚀 Starting queue workers...');
        startQueueWorkers();
        
        if (!options.once) {
          // Keep process alive
          process.on('SIGINT', () => {
            logger.info('Stopping queue workers...');
            process.exit(0);
          });
        }
      } catch (error) {
        logger.error('❌ Failed to start queue workers:', error);
        process.exit(1);
      }
    });
}
`;

  await fs.writeFile(path.join(commandsDir, 'queue-work.ts'), queueWorkContent);
}
