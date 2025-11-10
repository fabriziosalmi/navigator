#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Recursive copy directory function
 */
function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Parse command and app name
  let command = 'create-app';
  let appName = args[0];
  
  if (args[0] === 'create-app') {
    appName = args[1];
  }
  
  // Validate app name
  if (!appName) {
    console.log(chalk.red('❌ Error: App name is required'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.cyan('  npx @navigator.menu/cli create-app <app-name>'));
    console.log(chalk.cyan('  npx @navigator.menu/cli <app-name>'));
    console.log(chalk.gray('\nExample:'));
    console.log(chalk.cyan('  npx @navigator.menu/cli my-awesome-app'));
    process.exit(1);
  }
  
  // Resolve paths
  const targetPath = resolve(process.cwd(), appName);
  const templatePath = join(__dirname, '../templates/vanilla-js-app');
  
  // Check if template exists
  if (!existsSync(templatePath)) {
    console.log(chalk.red('❌ Error: Template not found'));
    console.log(chalk.gray(`Expected at: ${templatePath}`));
    process.exit(1);
  }
  
  // Check if target directory already exists
  if (existsSync(targetPath)) {
    console.log(chalk.red(`❌ Error: Directory "${appName}" already exists`));
    process.exit(1);
  }
  
  // Create app
  console.log();
  console.log(chalk.cyan.bold('🚀 Creating Navigator app...'));
  console.log();
  
  const spinner = ora(`Copying template to ${chalk.cyan(appName)}`).start();
  
  try {
    copyDir(templatePath, targetPath);
    spinner.succeed(chalk.green(`Created ${chalk.cyan(appName)} successfully!`));
    
    console.log();
    console.log(chalk.cyan.bold('📦 Next steps:'));
    console.log();
    console.log(chalk.gray('  1. Navigate to your project:'));
    console.log(chalk.cyan(`     cd ${appName}`));
    console.log();
    console.log(chalk.gray('  2. Install dependencies:'));
    console.log(chalk.cyan('     npm install'));
    console.log();
    console.log(chalk.gray('  3. Start development server:'));
    console.log(chalk.cyan('     npm run dev'));
    console.log();
    console.log(chalk.green('✨ Happy coding!'));
    console.log();
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to create app'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

main();
