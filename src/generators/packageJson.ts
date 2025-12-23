import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generatePackageJson(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const dependencies: Record<string, string> = {
    express: '^4.21.1',
    'express-rate-limit': '^8.2.1',
    cors: '^2.8.5',
    helmet: '^8.1.0',
    compression: '^1.8.1',
    dotenv: '^17.2.3',
    zod: '^3.25.76',
    winston: '^3.19.0',
    '@prisma/client': '^5.22.0',
    'swagger-jsdoc': '^6.2.8',
    'swagger-ui-express': '^5.0.1',
  };

  if (config.includeAuth) {
    dependencies['jsonwebtoken'] = '^9.0.2';
    dependencies['bcrypt'] = '^5.1.1';
    dependencies['nodemailer'] = '^6.9.8';
  }

  if (config.includeFileUpload) {
    dependencies['multer'] = '^1.4.5-lts.1';
    if (config.fileStorage === 's3') {
      dependencies['@aws-sdk/client-s3'] = '^3.700.0';
      dependencies['multer-s3'] = '^3.0.1';
    }
  }

  if (config.includeRedis) {
    dependencies['ioredis'] = '^5.4.1';
    if (config.includeQueue) {
      dependencies['bull'] = '^4.12.9';
      dependencies['@bull-board/api'] = '^5.18.0';
      dependencies['@bull-board/express'] = '^5.18.0';
    }
  }

  // Add node-cron for scheduled tasks
  dependencies['node-cron'] = '^3.0.3';
  // Add commander for CLI commands
  dependencies['commander'] = '^12.1.0';

  const devDependencies: Record<string, string> = {
    '@types/express': '^4.17.25',
    '@types/cors': '^2.8.19',
    '@types/compression': '^1.8.1',
    '@types/node': '^20.19.27',
    '@types/jsonwebtoken': '^9.0.10',
    '@types/bcrypt': '^5.0.2',
    '@types/nodemailer': '^6.4.14',
    '@types/multer': '^1.4.12',
    '@types/node-cron': '^3.0.11',
    '@types/commander': '^2.15.2',
    '@types/swagger-jsdoc': '^6.0.4',
    '@types/swagger-ui-express': '^4.1.8',
    '@types/jest': '^29.5.14',
    '@types/supertest': '^6.0.3',
    'typescript-eslint': '^8.50.1',
    '@eslint/js': '^9.39.2',
    eslint: '^9.39.2',
    prettier: '^3.7.4',
    'ts-jest': '^29.4.6',
    jest: '^30.2.0',
    supertest: '^7.1.4',
    tsx: '^4.21.0',
    typescript: '^5.9.3',
    prisma: '^5.22.0',
  };

  const packageJson: any = {
    name: config.projectName,
    version: '1.0.0',
    description: 'Production-ready backend API',
    main: 'dist/index.js',
    prisma: {
      seed: 'tsx prisma/seed.ts',
    },
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      lint: 'eslint src',
      'lint:fix': 'eslint src --fix',
      format: 'prettier --write "src/**/*.ts"',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:studio': 'prisma studio',
      'db:generate': 'prisma generate',
      'db:seed': 'tsx prisma/seed.ts',
      'make:controller': 'tsx scripts/make.ts controller',
      'make:service': 'tsx scripts/make.ts service',
      'make:repository': 'tsx scripts/make.ts repository',
      'make:route': 'tsx scripts/make.ts route',
      'cli': 'tsx scripts/commands/index.ts',
      'cache:clear': 'tsx scripts/commands/index.ts cache:clear',
      'queue:work': 'tsx scripts/commands/index.ts queue:work',
      ...(config.includeQueue && {
        'queue:dashboard': 'tsx src/queue/dashboard.ts',
      }),
      ...(config.includeDocker && {
        'docker:up': 'docker-compose up -d',
        'docker:down': 'docker-compose down',
      }),
    },
    keywords: ['backend', 'api', 'express', 'typescript'],
    author: '',
    license: 'MIT',
    dependencies,
    devDependencies,
    engines: {
      node: '>=20.0.0',
    },
  };

  await fs.writeJSON(path.join(projectPath, 'package.json'), packageJson, {
    spaces: 2,
  });
}

