#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { Runner } from './Runner';
import { CLIOptions } from './types';

const program = new Command();

program
  .name('e2e')
  .description('E2E testing framework for web applications')
  .version('1.0.0');

program
  .command('run [pattern]')
  .description('Run test files matching the given pattern')
  .option('-b, --browser <name>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
  .option('--headless', 'Run in headless mode', true)
  .option('--no-headless', 'Run with browser UI visible')
  .option('-p, --parallel <count>', 'Number of parallel workers', '1')
  .option('-r, --reporter <type>', 'Reporter type (console, json, html, junit)', 'console')
  .option('-f, --filter <tag>', 'Run only tests matching this tag', '')
  .option('-t, --timeout <ms>', 'Default test timeout in ms', '30000')
  .option('--retries <count>', 'Number of retries for failed tests', '0')
  .action(async (pattern: string | undefined, opts) => {
    const options: CLIOptions = {
      browser: opts.browser,
      headless: opts.headless,
      parallel: parseInt(opts.parallel, 10),
      reporter: opts.reporter,
      filter: opts.filter,
      timeout: parseInt(opts.timeout, 10),
      retries: parseInt(opts.retries, 10),
    };

    const runner = new Runner(options);
    const testPattern = pattern ?? '**/*.test.{ts,js}';

    console.log(chalk.cyan(`\nE2E Test Runner v1.0.0`));
    console.log(chalk.gray(`Browser: ${options.browser} | Headless: ${options.headless} | Workers: ${options.parallel}\n`));

    const result = await runner.run(testPattern);

    if (result.failed > 0) {
      process.exitCode = 1;
    }
  });

program.parse(process.argv);
