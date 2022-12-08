export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export interface TestSuite {
  name: string;
  tests: TestCase[];
  suites: TestSuite[];
  beforeAll: HookFn[];
  afterAll: HookFn[];
  beforeEach: HookFn[];
  afterEach: HookFn[];
  tags: string[];
  skip: boolean;
  only: boolean;
}

export interface TestCase {
  name: string;
  fn: TestFn;
  timeout: number;
  retries: number;
  tags: string[];
  skip: boolean;
  only: boolean;
}

export type TestFn = () => Promise<void> | void;
export type HookFn = () => Promise<void> | void;

export interface TestResult {
  suite: string;
  test: string;
  status: TestStatus;
  duration: number;
  error?: TestError;
  retries: number;
  attempts: number;
}

export interface TestError {
  message: string;
  expected?: unknown;
  received?: unknown;
  stack?: string;
}

export interface RunResult {
  suites: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}

export interface Assertion<T = unknown> {
  value: T;
  negated: boolean;
  soft: boolean;
}

export interface BrowserConfig {
  name: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  viewport: { width: number; height: number };
  timeout: number;
  slowMo?: number;
}

export interface PageObject {
  url: string;
  title: string;
  cookies: Cookie[];
}

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  expires?: number;
}

export type Selector = {
  type: 'css' | 'xpath' | 'testid' | 'role' | 'text' | 'placeholder';
  value: string;
};

export type WaitCondition =
  | { type: 'visible'; selector: Selector }
  | { type: 'hidden'; selector: Selector }
  | { type: 'url'; pattern: string | RegExp }
  | { type: 'timeout'; ms: number }
  | { type: 'networkIdle' };

export interface ReporterConfig {
  type: 'console' | 'json' | 'html' | 'junit';
  outputPath?: string;
}

export interface CLIOptions {
  browser: string;
  headless: boolean;
  parallel: number;
  reporter: string;
  filter: string;
  timeout: number;
  retries: number;
}
