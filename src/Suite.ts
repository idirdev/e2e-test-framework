import { TestSuite, TestCase, TestFn, HookFn } from './types';

let currentSuite: TestSuite | null = null;
const suiteStack: TestSuite[] = [];

function createSuite(name: string): TestSuite {
  return {
    name,
    tests: [],
    suites: [],
    beforeAll: [],
    afterAll: [],
    beforeEach: [],
    afterEach: [],
    tags: [],
    skip: false,
    only: false,
  };
}

export function describe(name: string, fn: () => void): TestSuite {
  const suite = createSuite(name);
  const parent = currentSuite;

  if (parent) {
    parent.suites.push(suite);
  }

  suiteStack.push(suite);
  currentSuite = suite;
  fn();
  suiteStack.pop();
  currentSuite = suiteStack.length > 0 ? suiteStack[suiteStack.length - 1] : null;

  // Export the top-level suite
  if (!parent) {
    (globalThis as any).__suite = suite;
  }

  return suite;
}

describe.skip = function skipDescribe(name: string, fn: () => void): TestSuite {
  const suite = describe(name, fn);
  suite.skip = true;
  return suite;
};

describe.only = function onlyDescribe(name: string, fn: () => void): TestSuite {
  const suite = describe(name, fn);
  suite.only = true;
  return suite;
};

export function it(name: string, fn: TestFn, options: Partial<Pick<TestCase, 'timeout' | 'retries' | 'tags'>> = {}): void {
  if (!currentSuite) throw new Error('it() must be called inside a describe() block');

  const test: TestCase = {
    name,
    fn,
    timeout: options.timeout ?? 30000,
    retries: options.retries ?? 0,
    tags: options.tags ?? [],
    skip: false,
    only: false,
  };

  currentSuite.tests.push(test);
}

it.skip = function skipIt(name: string, fn: TestFn, options: Partial<Pick<TestCase, 'timeout' | 'retries' | 'tags'>> = {}): void {
  it(name, fn, options);
  const tests = currentSuite?.tests;
  if (tests && tests.length > 0) {
    tests[tests.length - 1].skip = true;
  }
};

it.only = function onlyIt(name: string, fn: TestFn, options: Partial<Pick<TestCase, 'timeout' | 'retries' | 'tags'>> = {}): void {
  it(name, fn, options);
  const tests = currentSuite?.tests;
  if (tests && tests.length > 0) {
    tests[tests.length - 1].only = true;
  }
};

export function beforeAll(fn: HookFn): void {
  if (!currentSuite) throw new Error('beforeAll() must be called inside a describe() block');
  currentSuite.beforeAll.push(fn);
}

export function afterAll(fn: HookFn): void {
  if (!currentSuite) throw new Error('afterAll() must be called inside a describe() block');
  currentSuite.afterAll.push(fn);
}

export function beforeEach(fn: HookFn): void {
  if (!currentSuite) throw new Error('beforeEach() must be called inside a describe() block');
  currentSuite.beforeEach.push(fn);
}

export function afterEach(fn: HookFn): void {
  if (!currentSuite) throw new Error('afterEach() must be called inside a describe() block');
  currentSuite.afterEach.push(fn);
}

export function tag(...tags: string[]): void {
  if (!currentSuite) throw new Error('tag() must be called inside a describe() block');
  currentSuite.tags.push(...tags);
}
