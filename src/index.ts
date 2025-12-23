#!/usr/bin/env node

import { createProject } from './createProject.js';
import { parseArgs } from './utils/parseArgs.js';
import chalk from 'chalk';

const banner = `
${chalk.cyan.bold('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.cyan.bold('║')}                                                               ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold(' ██████╗ ██████╗ ██████╗ ███████╗')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██╔════╝██╔═══██╗██╔══██╗██╔════╝')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██║     ██║   ██║██████╔╝█████╗  ')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██║     ██║   ██║██╔══██╗██╔══╝  ')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('╚██████╗╚██████╝ ██║  ██║███████╗')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}                                                               ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██████╗  █████╗  ██████╗██╗  ██╗')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██╔══██╗██╔══██╗██╔════╝██║ ██╔╝')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██████╔╝███████║██║     █████╔╝ ')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██╔══██╗██╔══██║██║     ██╔═██╗ ')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('██████╔╝██║  ██║╚██████╗██║  ██╗')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.white.bold('╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝')}                      ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}                                                               ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}      ${chalk.gray('     Production-Ready Backend Generator')}                  ${chalk.cyan.bold('║')}
${chalk.cyan.bold('║')}                                                               ${chalk.cyan.bold('║')}
${chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════╝')}
`;

async function main() {
  try {
    console.log(banner);
    
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

