import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateRedisCache(
  servicesDir: string,
  config: ProjectConfig
): Promise<void> {
  const cacheServiceContent = `import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(\`Cache get error for key \${key}:\`, error);
      return null;
    }
  },

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (options?.ttl) {
        await redis.setex(key, options.ttl, data);
      } else {
        await redis.set(key, data);
      }
    } catch (error) {
      logger.error(\`Cache set error for key \${key}:\`, error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(\`Cache delete error for key \${key}:\`, error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(\`Cache exists error for key \${key}:\`, error);
      return false;
    }
  },

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(\`Cache clear pattern error for \${pattern}:\`, error);
    }
  },
};
`;

  await fs.writeFile(path.join(servicesDir, 'cache.service.ts'), cacheServiceContent);
}
