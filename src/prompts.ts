import inquirer from 'inquirer';

import { ProjectConfig, DatabaseType, PackageManager } from './types.js';

export async function promptProjectConfig(
  defaultName?: string
): Promise<ProjectConfig> {
  // If project name is provided as argument, use it directly without prompting
  const projectName = defaultName 
    ? defaultName.toLowerCase().trim()
    : undefined;

  // Validate the provided name if it exists
  if (projectName) {
    if (!/^[a-z0-9-]+$/.test(projectName)) {
      throw new Error('Project name must be lowercase, alphanumeric, and can contain hyphens');
    }
  }

  const answers = await inquirer.prompt([
    ...(projectName ? [] : [{
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-project',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Project name cannot be empty';
        }
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name must be lowercase, alphanumeric, and can contain hyphens';
        }
        return true;
      },
      filter: (input: string) => input.toLowerCase().trim(),
    }]),
    {
      type: 'list',
      name: 'database',
      message: 'Select database:',
      choices: [
        { name: 'PostgreSQL', value: 'postgresql' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'MongoDB', value: 'mongodb' },
        { name: 'SQLite', value: 'sqlite' },
      ],
    },
    {
      type: 'confirm',
      name: 'includeAuth',
      message: 'Include JWT authentication?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'includeDocker',
      message: 'Include Docker configuration?',
      default: true,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Select package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'pnpm', value: 'pnpm' },
        { name: 'yarn', value: 'yarn' },
      ],
    },
  ]);

  return {
    ...answers,
    projectName: projectName || answers.projectName,
  } as ProjectConfig;
}

