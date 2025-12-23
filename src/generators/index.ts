import { ProjectConfig } from '../types.js';
import { generatePackageJson } from './packageJson.js';
import { generateTsConfig } from './tsconfig.js';
import { generateEnvExample } from './envExample.js';
import { generateGitIgnore } from './gitignore.js';
import { generateEslintConfig } from './eslint.js';
import { generatePrettierConfig } from './prettier.js';
import { generateJestConfig } from './jest.js';
import { generateDockerFiles } from './docker.js';
import { generatePrismaSchema } from './prisma.js';
import { generateSourceFiles } from './sourceFiles/index.js';
import { generateGitHubActions } from './githubActions.js';
import { generateCursorRules } from './cursorRules.js';
import path from 'path';
import fs from 'fs-extra';

export async function generateProjectFiles(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Root files
  await generatePackageJson(projectPath, config);
  await generateTsConfig(projectPath);
  await generateEnvExample(projectPath, config);
  await generateGitIgnore(projectPath);
  await generateEslintConfig(projectPath);
  await generatePrettierConfig(projectPath);
  await generateJestConfig(projectPath);
  await generateCursorRules(projectPath);
  
  // Docker
  if (config.includeDocker) {
    await generateDockerFiles(projectPath, config);
  }

  // Prisma
  await generatePrismaSchema(projectPath, config);
  
  // Source files
  await generateSourceFiles(projectPath, config);
  
  // GitHub Actions
  await generateGitHubActions(projectPath, config);
}

