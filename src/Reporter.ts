import chalk from 'chalk';
import * as fs from 'fs';
import { RunResult, TestResult } from './types';

export interface Reporter {
  report(result: RunResult): void;
}

export class ConsoleReporter implements Reporter {
  report(result: RunResult): void {
    const grouped = this.groupBySuite(result.results);

    for (const [suite, tests] of Object.entries(grouped)) {
      console.log(chalk.bold(`\n  ${suite}`));

      for (const test of tests) {
        const icon = test.status === 'passed' ? chalk.green('  PASS') : test.status === 'failed' ? chalk.red('  FAIL') : chalk.yellow('  SKIP');
        const duration = chalk.gray(`(${test.duration}ms)`);
        const retryInfo = test.attempts > 1 ? chalk.yellow(` [attempt ${test.attempts}/${test.retries + 1}]`) : '';
        console.log(`${icon} ${test.test} ${duration}${retryInfo}`);

        if (test.error) {
          console.log(chalk.red(`       ${test.error.message}`));
          if (test.error.stack) {
            const stackLines = test.error.stack.split('\n').slice(1, 3);
            for (const line of stackLines) {
              console.log(chalk.gray(`       ${line.trim()}`));
            }
          }
        }
      }
    }

    console.log(chalk.bold('\n  Summary'));
    console.log(`  ${chalk.green(`${result.passed} passed`)} | ${chalk.red(`${result.failed} failed`)} | ${chalk.yellow(`${result.skipped} skipped`)}`);
    console.log(`  ${result.suites} suites | ${result.tests} tests | ${chalk.gray(`${result.duration}ms`)}\n`);
  }

  private groupBySuite(results: TestResult[]): Record<string, TestResult[]> {
    const grouped: Record<string, TestResult[]> = {};
    for (const r of results) {
      (grouped[r.suite] ??= []).push(r);
    }
    return grouped;
  }
}

export class JsonReporter implements Reporter {
  report(result: RunResult): void {
    const output = JSON.stringify(result, null, 2);
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/results.json', output, 'utf-8');
    console.log(`JSON report written to reports/results.json`);
  }
}

export class HtmlReporter implements Reporter {
  report(result: RunResult): void {
    const rows = result.results.map((r) => {
      const statusColor = r.status === 'passed' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#eab308';
      return `<tr>
        <td>${r.suite}</td>
        <td>${r.test}</td>
        <td style="color:${statusColor};font-weight:bold">${r.status.toUpperCase()}</td>
        <td>${r.duration}ms</td>
        <td>${r.error?.message ?? ''}</td>
      </tr>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html><head><title>E2E Test Report</title>
<style>body{font-family:sans-serif;max-width:960px;margin:2rem auto}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}.summary{display:flex;gap:2rem;margin:1rem 0}
.stat{padding:1rem;border-radius:8px;background:#f5f5f5}</style>
</head><body>
<h1>E2E Test Report</h1>
<div class="summary">
  <div class="stat">Passed: ${result.passed}</div>
  <div class="stat">Failed: ${result.failed}</div>
  <div class="stat">Skipped: ${result.skipped}</div>
  <div class="stat">Duration: ${result.duration}ms</div>
</div>
<table><thead><tr><th>Suite</th><th>Test</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;

    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/report.html', html, 'utf-8');
    console.log(`HTML report written to reports/report.html`);
  }
}

export class JUnitReporter implements Reporter {
  report(result: RunResult): void {
    const testcases = result.results.map((r) => {
      const failure = r.error
        ? `<failure message="${this.escapeXml(r.error.message)}">${this.escapeXml(r.error.stack ?? '')}</failure>`
        : '';
      const skipped = r.status === 'skipped' ? '<skipped/>' : '';
      return `    <testcase classname="${this.escapeXml(r.suite)}" name="${this.escapeXml(r.test)}" time="${(r.duration / 1000).toFixed(3)}">${failure}${skipped}</testcase>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${result.tests}" failures="${result.failed}" time="${(result.duration / 1000).toFixed(3)}">
  <testsuite name="e2e" tests="${result.tests}" failures="${result.failed}" skipped="${result.skipped}">
${testcases}
  </testsuite>
</testsuites>`;

    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/junit.xml', xml, 'utf-8');
    console.log(`JUnit report written to reports/junit.xml`);
  }

  private escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
