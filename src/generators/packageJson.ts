import { ProjectConfig } from '../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generatePackageJson(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const dependencies: Record<string, string> = {
    express: '^4.18.2',
    'express-rate-limit': '^7.1.5',
    cors: '^2.8.5',
    helmet: '^7.1.0',
    compression: '^1.7.4',
    dotenv: '^16.4.1',
    zod: '^3.22.4',
    winston: '^3.11.0',
    '@prisma/client': '^5.9.1',
    'swagger-jsdoc': '^6.2.8',
    'swagger-ui-express': '^5.0.0',
  };

  if (config.includeAuth) {
    dependencies['jsonwebtoken'] = '^9.0.2';
    dependencies['bcrypt'] = '^5.1.1';
  }

  const devDependencies: Record<string, string> = {
    '@types/express': '^4.17.21',
    '@types/cors': '^2.8.17',
    '@types/compression': '^1.7.5',
    '@types/node': '^20.11.5',
    '@types/jsonwebtoken': '^9.0.5',
    '@types/bcrypt': '^5.0.2',
    '@types/swagger-jsdoc': '^6.0.4',
    '@types/swagger-ui-express': '^4.1.6',
    '@types/jest': '^29.5.11',
    '@types/supertest': '^6.0.2',
    '@typescript-eslint/eslint-plugin': '^6.19.1',
    '@typescript-eslint/parser': '^6.19.1',
    eslint: '^8.56.0',
    prettier: '^3.2.4',
    'ts-jest': '^29.1.2',
    jest: '^29.7.0',
    supertest: '^6.3.4',
    tsx: '^4.7.1',
    typescript: '^5.3.3',
    prisma: '^5.9.1',
  };

  const packageJson = {
    name: config.projectName,
    version: '1.0.0',
    description: 'Production-ready backend API',
    main: 'dist/index.js',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      lint: 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',
      format: 'prettier --write "src/**/*.ts"',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:studio': 'prisma studio',
      'db:generate': 'prisma generate',
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

