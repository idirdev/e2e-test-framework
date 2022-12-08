import * as path from 'path';
import * as fs from 'fs';
import { TestSuite, TestCase, TestResult, RunResult, CLIOptions, TestStatus } from './types';
import { ConsoleReporter, JsonReporter, HtmlReporter, JUnitReporter, Reporter } from './Reporter';

export class Runner {
  private options: CLIOptions;
  private results: TestResult[] = [];

  constructor(options: CLIOptions) {
    this.options = options;
  }

  async run(pattern: string): Promise<RunResult> {
    const startTime = Date.now();
    const files = this.discoverFiles(pattern);
    const suites: TestSuite[] = [];

    for (const file of files) {
      try {
        const suite = require(path.resolve(file));
        if (suite && suite.__suite) {
          suites.push(suite.__suite);
        }
      } catch (err) {
        console.error(`Failed to load test file: ${file}`, err);
      }
    }

    if (this.options.parallel > 1) {
      await this.runParallel(suites);
    } else {
      for (const suite of suites) {
        await this.runSuite(suite);
      }
    }

    const result = this.buildResult(startTime);
    const reporter = this.createReporter();
    reporter.report(result);
    return result;
  }

  private discoverFiles(pattern: string): string[] {
    const baseDir = process.cwd();
    const files: string[] = [];

    const walk = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          walk(fullPath);
        } else if (entry.isFile() && this.matchesPattern(entry.name, pattern)) {
          files.push(fullPath);
        }
      }
    };

    walk(baseDir);
    return files;
  }

  private matchesPattern(filename: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename.includes(pattern);
  }

  private async runSuite(suite: TestSuite): Promise<void> {
    if (suite.skip) {
      for (const test of suite.tests) {
        this.results.push({ suite: suite.name, test: test.name, status: 'skipped', duration: 0, retries: 0, attempts: 0 });
      }
      return;
    }

    // Run beforeAll hooks
    for (const hook of suite.beforeAll) {
      try { await hook(); } catch (err) {
        console.error(`beforeAll hook failed in "${suite.name}"`, err);
        return;
      }
    }

    // Filter by tag if specified
    const tests = this.options.filter
      ? suite.tests.filter((t) => t.tags.includes(this.options.filter))
      : suite.tests;

    // Check for .only tests
    const onlyTests = tests.filter((t) => t.only);
    const testsToRun = onlyTests.length > 0 ? onlyTests : tests;

    for (const test of testsToRun) {
      await this.runTest(suite, test);
    }

    // Run nested suites
    for (const nested of suite.suites) {
      await this.runSuite(nested);
    }

    // Run afterAll hooks
    for (const hook of suite.afterAll) {
      try { await hook(); } catch (err) {
        console.error(`afterAll hook failed in "${suite.name}"`, err);
      }
    }
  }

  private async runTest(suite: TestSuite, test: TestCase): Promise<void> {
    if (test.skip) {
      this.results.push({ suite: suite.name, test: test.name, status: 'skipped', duration: 0, retries: 0, attempts: 0 });
      return;
    }

    const maxAttempts = (test.retries || this.options.retries) + 1;
    let lastResult: TestResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Run beforeEach hooks
      for (const hook of suite.beforeEach) {
        try { await hook(); } catch { break; }
      }

      const start = Date.now();
      let status: TestStatus = 'passed';
      let error: TestResult['error'] = undefined;

      try {
        await Promise.race([
          Promise.resolve(test.fn()),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Test timed out after ${test.timeout || this.options.timeout}ms`)), test.timeout || this.options.timeout)
          ),
        ]);
      } catch (err) {
        status = 'failed';
        error = {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        };
      }

      // Run afterEach hooks
      for (const hook of suite.afterEach) {
        try { await hook(); } catch { /* swallow */ }
      }

      lastResult = { suite: suite.name, test: test.name, status, duration: Date.now() - start, error, retries: test.retries, attempts: attempt };

      if (status === 'passed') break;
    }

    if (lastResult) this.results.push(lastResult);
  }

  private async runParallel(suites: TestSuite[]): Promise<void> {
    const chunks: TestSuite[][] = [];
    const chunkSize = Math.ceil(suites.length / this.options.parallel);
    for (let i = 0; i < suites.length; i += chunkSize) {
      chunks.push(suites.slice(i, i + chunkSize));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        for (const suite of chunk) {
          await this.runSuite(suite);
        }
      })
    );
  }

  private buildResult(startTime: number): RunResult {
    return {
      suites: new Set(this.results.map((r) => r.suite)).size,
      tests: this.results.length,
      passed: this.results.filter((r) => r.status === 'passed').length,
      failed: this.results.filter((r) => r.status === 'failed').length,
      skipped: this.results.filter((r) => r.status === 'skipped').length,
      duration: Date.now() - startTime,
      results: this.results,
    };
  }

  private createReporter(): Reporter {
    switch (this.options.reporter) {
      case 'json': return new JsonReporter();
      case 'html': return new HtmlReporter();
      case 'junit': return new JUnitReporter();
      default: return new ConsoleReporter();
    }
  }
}
