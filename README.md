> **Archived** — Kept for reference. Not part of the current portfolio.

# e2e-test-framework

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

A full-featured E2E testing framework for web applications with parallel execution, rich assertions, and multiple reporter formats.

## Features

- **Test Suites** - `describe`/`it` with `beforeAll`, `afterAll`, `beforeEach`, `afterEach`
- **Skip/Only** - `describe.skip()`, `describe.only()`, `it.skip()`, `it.only()`
- **Tags** - Filter tests by tag for selective execution
- **Parallel Execution** - Run suites across multiple workers
- **Retry** - Automatically retry failed tests
- **Assertions** - Rich `expect()` API with `.not` negation and soft assertions
- **Page Abstraction** - Navigate, click, type, wait, screenshot
- **Reporters** - Console (colored), JSON, HTML, JUnit XML

## Quick Start

```bash
npm install
npm run build

# Run all tests
npx e2e run

# Run with options
npx e2e run --browser chromium --parallel 4 --reporter html
```

## Writing Tests

```typescript
import { describe, it, beforeAll, afterAll, beforeEach } from 'e2e-test-framework/Suite';
import { expect } from 'e2e-test-framework/Assertions';
import { Page } from 'e2e-test-framework/Page';
import { byTestId, byText } from 'e2e-test-framework/utils/selectors';

describe('Login Page', () => {
  let page: Page;

  beforeAll(async () => {
    page = new Page({ headless: true });
  });

  afterAll(async () => {
    await page.close();
  });

  it('should display login form', async () => {
    await page.goto('https://example.com/login');
    const title = await page.getText(byTestId('login-title'));
    expect(title).toContain('Sign In');
  });

  it('should login with valid credentials', async () => {
    await page.type(byTestId('email'), 'user@example.com');
    await page.type(byTestId('password'), 'password123');
    await page.click(byText('Sign In'));
    await page.waitFor({ type: 'url', pattern: '/dashboard' });
    expect(page.getUrl()).toContain('/dashboard');
  }, { timeout: 10000, retries: 2, tags: ['smoke'] });

  it.skip('should handle OAuth', async () => {
    // Not implemented yet
  });
});
```

## Assertion API

```typescript
expect(value).toBe(expected)          // Strict equality (Object.is)
expect(value).toEqual(expected)       // Deep equality
expect(value).toContain(item)         // String/array contains
expect(value).toBeTruthy()            // Truthy check
expect(value).toBeFalsy()             // Falsy check
expect(value).toBeNull()              // Null check
expect(value).toBeUndefined()         // Undefined check
expect(value).toBeDefined()           // Not undefined
expect(value).toHaveLength(n)         // Length check
expect(value).toMatch(/regex/)        // Regex match
expect(fn).toThrow('message')         // Throw check
expect(value).toBeGreaterThan(n)      // > n
expect(value).toBeLessThan(n)         // < n
expect(value).toBeInstanceOf(Class)   // instanceof
expect(value).toSatisfy(fn)           // Custom predicate

// Negation
expect(value).not.toBe(other)

// Soft assertions (collect all failures)
expect(a).softly.toBe(1)
expect(b).softly.toBe(2)
flushSoftErrors()  // Throws if any soft assertion failed
```

## Reporter Formats

| Reporter | Output | Description |
|----------|--------|-------------|
| `console` | stdout | Colored pass/fail with timing |
| `json` | `reports/results.json` | Machine-readable JSON |
| `html` | `reports/report.html` | Visual HTML report |
| `junit` | `reports/junit.xml` | JUnit XML for CI integration |

## CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `-b, --browser` | `chromium` | Browser engine |
| `--headless` | `true` | Headless mode |
| `-p, --parallel` | `1` | Parallel workers |
| `-r, --reporter` | `console` | Reporter type |
| `-f, --filter` | `` | Tag filter |
| `-t, --timeout` | `30000` | Test timeout (ms) |
| `--retries` | `0` | Retry failed tests |

## Project Structure

```
src/
  index.ts          - CLI entry point
  types.ts          - TypeScript interfaces
  Runner.ts         - Test discovery and execution
  Suite.ts          - describe/it/hooks DSL
  Assertions.ts     - expect() assertion library
  Page.ts           - Browser page abstraction
  Reporter.ts       - Output formatters
  utils/
    selectors.ts    - Selector helper functions
```

## License

MIT
