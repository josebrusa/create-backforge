#!/usr/bin/env node

import { createProject } from './createProject.js';
import { parseArgs } from './utils/parseArgs.js';
import chalk from 'chalk';

async function main() {
  try {
    console.log(chalk.blue.bold('\n🔥 BackForge - Production-Ready Backend Generator\n'));
    
    const projectName = parseArgs();
    await createProject(projectName);
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
    } else {
      console.error(chalk.red('\n❌ Unexpected error occurred'));
    }
    process.exit(1);
  }
}

main();

