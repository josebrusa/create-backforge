import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectConfig } from './types.js';
import { promptProjectConfig } from './prompts.js';
import { generateProjectFiles } from './generators/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createProject(defaultName?: string) {
  const config = await promptProjectConfig(defaultName);
  const projectPath = path.resolve(process.cwd(), config.projectName);

  if (existsSync(projectPath)) {
    throw new Error(`Directory ${config.projectName} already exists`);
  }

  const spinner = ora('Creating project structure...').start();

  try {
    // Create project directory
    await fs.ensureDir(projectPath);

    spinner.text = 'Generating project files...';
    await generateProjectFiles(projectPath, config);

    spinner.text = 'Installing dependencies...';
    spinner.stop();
    
    const installSpinner = ora('Installing dependencies (this may take a while)...').start();
    
    const originalCwd = process.cwd();
    try {
      process.chdir(projectPath);
      
      const installCommand = getInstallCommand(config.packageManager);
      execSync(installCommand, { stdio: 'inherit' });

      if (config.database !== 'sqlite') {
        installSpinner.text = 'Generating Prisma client...';
        execSync(`${config.packageManager} run db:generate`, { stdio: 'inherit' });
      }

      installSpinner.succeed('Dependencies installed successfully');
    } finally {
      process.chdir(originalCwd);
    }

    // Success message
    console.log(chalk.green.bold('\n✅ Project created successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  cd ${config.projectName}`));
    console.log(chalk.white('  cp .env.example .env'));
    
    if (config.database !== 'sqlite') {
      console.log(chalk.white(`  ${config.packageManager} run db:push`));
    }
    
    console.log(chalk.white(`  ${config.packageManager} run dev\n`));
    console.log(chalk.cyan('📚 Docs will be available at: http://localhost:3000/api-docs\n'));

  } catch (error) {
    spinner.fail('Failed to create project');
    if (existsSync(projectPath)) {
      await fs.remove(projectPath);
    }
    throw error;
  }
}

function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case 'pnpm':
      return 'pnpm install';
    case 'yarn':
      return 'yarn install';
    default:
      return 'npm install';
  }
}

