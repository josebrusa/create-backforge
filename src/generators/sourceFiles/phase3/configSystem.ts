import fs from 'fs-extra';
import path from 'path';

export async function generateConfigSystem(configDir: string): Promise<void> {
  // app.config.ts
  const appConfigContent = `import { z } from 'zod';
import { config as envConfig } from './env.js';

export const appConfig = {
  name: envConfig.NODE_ENV === 'production' ? 'CoreBack API' : 'CoreBack API (Dev)',
  version: '1.0.0',
  environment: envConfig.NODE_ENV,
  port: envConfig.PORT,
  url: envConfig.NODE_ENV === 'production'
    ? 'https://api.example.com'
    : \`http://localhost:\${envConfig.PORT}\`,
};
`;

  await fs.writeFile(path.join(configDir, 'app.config.ts'), appConfigContent);

  // database.config.ts
  const dbConfigContent = `import { config as envConfig } from './env.js';

export const databaseConfig = {
  url: envConfig.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  timeout: 20000,
};
`;

  await fs.writeFile(path.join(configDir, 'database.config.ts'), dbConfigContent);

  // cache.config.ts
  const cacheConfigContent = `import { config as envConfig } from './env.js';

export const cacheConfig = {
  ttl: 3600, // 1 hour default
  prefix: 'coreback:',
  ...(envConfig.REDIS_HOST && {
    redis: {
      host: envConfig.REDIS_HOST,
      port: envConfig.REDIS_PORT,
      password: envConfig.REDIS_HOST ? envConfig.REDIS_PASSWORD : undefined,
      db: envConfig.REDIS_DB,
    },
  }),
};
`;

  await fs.writeFile(path.join(configDir, 'cache.config.ts'), cacheConfigContent);

  // index.ts to export all configs
  const configIndexContent = `export { config as envConfig } from './env.js';
export { appConfig } from './app.config.js';
export { databaseConfig } from './database.config.js';
export { cacheConfig } from './cache.config.js';
`;

  await fs.writeFile(path.join(configDir, 'index.ts'), configIndexContent);
}
