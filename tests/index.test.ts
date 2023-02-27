import { describe, it, expect } from 'vitest';
import {
  expect as frameworkExpect,
  getSoftErrors,
  clearSoftErrors,
  flushSoftErrors,
  addMatcher,
} from '../src/Assertions';
import {
  describe as frameworkDescribe,
  it as frameworkIt,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  tag,
} from '../src/Suite';
import { Page } from '../src/Page';
import { Runner } from '../src/Runner';

// ─── Assertions (Expectation) ───

describe('Assertions', () => {
  describe('toBe', () => {
    it('should pass when values are identical', () => {
      expect(() => frameworkExpect(42).toBe(42)).not.toThrow();
    });

    it('should throw when values differ', () => {
      expect(() => frameworkExpect(42).toBe(99)).toThrow();
    });
  });

  describe('toEqual', () => {
    it('should deep-compare objects', () => {
      expect(() => frameworkExpect({ a: 1 }).toEqual({ a: 1 })).not.toThrow();
    });

    it('should throw on different objects', () => {
      expect(() => frameworkExpect({ a: 1 }).toEqual({ a: 2 })).toThrow();
    });
  });

  describe('toContain', () => {
    it('should find a substring', () => {
      expect(() => frameworkExpect('hello world').toContain('world')).not.toThrow();
    });

    it('should find an item in an array', () => {
      expect(() => frameworkExpect([1, 2, 3]).toContain(2)).not.toThrow();
    });

    it('should throw when substring is missing', () => {
      expect(() => frameworkExpect('hello').toContain('xyz')).toThrow();
    });
  });

  describe('toBeTruthy / toBeFalsy', () => {
    it('should pass for truthy value', () => {
      expect(() => frameworkExpect(1).toBeTruthy()).not.toThrow();
    });

    it('should pass for falsy value', () => {
      expect(() => frameworkExpect(0).toBeFalsy()).not.toThrow();
    });

    it('should throw when value is not truthy', () => {
      expect(() => frameworkExpect(0).toBeTruthy()).toThrow();
    });
  });

  describe('toBeNull / toBeUndefined / toBeDefined', () => {
    it('should pass for null', () => {
      expect(() => frameworkExpect(null).toBeNull()).not.toThrow();
    });

    it('should pass for undefined', () => {
      expect(() => frameworkExpect(undefined).toBeUndefined()).not.toThrow();
    });

    it('should pass for defined value', () => {
      expect(() => frameworkExpect('hi').toBeDefined()).not.toThrow();
    });
  });

  describe('toHaveLength', () => {
    it('should pass for correct array length', () => {
      expect(() => frameworkExpect([1, 2, 3]).toHaveLength(3)).not.toThrow();
    });

    it('should throw for wrong length', () => {
      expect(() => frameworkExpect([1]).toHaveLength(5)).toThrow();
    });
  });

  describe('toMatch', () => {
    it('should match a regex pattern', () => {
      expect(() => frameworkExpect('test123').toMatch(/\d+/)).not.toThrow();
    });

    it('should match a string pattern', () => {
      expect(() => frameworkExpect('test123').toMatch('\\d+')).not.toThrow();
    });
  });

  describe('toThrow', () => {
    it('should pass when function throws', () => {
      expect(() =>
        frameworkExpect(() => {
          throw new Error('boom');
        }).toThrow()
      ).not.toThrow();
    });

    it('should match error message', () => {
      expect(() =>
        frameworkExpect(() => {
          throw new Error('something went wrong');
        }).toThrow('went wrong')
      ).not.toThrow();
    });

    it('should throw when function does not throw', () => {
      expect(() => frameworkExpect(() => {}).toThrow()).toThrow();
    });
  });

  describe('toBeGreaterThan / toBeLessThan', () => {
    it('should pass when greater', () => {
      expect(() => frameworkExpect(10).toBeGreaterThan(5)).not.toThrow();
    });

    it('should pass when less', () => {
      expect(() => frameworkExpect(2).toBeLessThan(10)).not.toThrow();
    });
  });

  describe('not (negation)', () => {
    it('should invert toBe', () => {
      expect(() => frameworkExpect(1).not.toBe(2)).not.toThrow();
    });

    it('should invert toContain', () => {
      expect(() => frameworkExpect('hello').not.toContain('xyz')).not.toThrow();
    });

    it('should throw when negated condition is actually true', () => {
      expect(() => frameworkExpect(1).not.toBe(1)).toThrow();
    });
  });

  describe('soft assertions', () => {
    it('should collect errors without throwing', () => {
      clearSoftErrors();
      frameworkExpect(1).softly.toBe(999);
      frameworkExpect(2).softly.toBe(888);

      const errors = getSoftErrors();
      expect(errors).toHaveLength(2);
      clearSoftErrors();
    });

    it('should flush and throw all accumulated errors', () => {
      clearSoftErrors();
      frameworkExpect('a').softly.toBe('b');
      expect(() => flushSoftErrors()).toThrow(/Soft assertion failures/);
    });

    it('should not throw when no soft errors', () => {
      clearSoftErrors();
      expect(() => flushSoftErrors()).not.toThrow();
    });
  });

  describe('toSatisfy', () => {
    it('should pass for a custom predicate', () => {
      expect(() =>
        frameworkExpect(10).toSatisfy((v) => (v as number) % 2 === 0)
      ).not.toThrow();
    });

    it('should throw when predicate fails', () => {
      expect(() =>
        frameworkExpect(7).toSatisfy((v) => (v as number) % 2 === 0)
      ).toThrow();
    });
  });

  describe('addMatcher', () => {
    it('should register and use a custom matcher', () => {
      addMatcher<number>('toBeEven', (received) => ({
        pass: received % 2 === 0,
        message: `Expected ${received} to be even`,
      }));

      // Access the custom matcher via the returned expectation object
      const exp = frameworkExpect(4) as any;
      expect(() => exp.toBeEven()).not.toThrow();

      const exp2 = frameworkExpect(3) as any;
      expect(() => exp2.toBeEven()).toThrow();
    });
  });
});

// ─── Suite (describe / it / hooks) ───

describe('Suite', () => {
  it('should create a suite with tests', () => {
    const suite = frameworkDescribe('MySuite', () => {
      frameworkIt('test1', () => {});
      frameworkIt('test2', () => {});
    });

    expect(suite.name).toBe('MySuite');
    expect(suite.tests).toHaveLength(2);
    expect(suite.tests[0].name).toBe('test1');
    expect(suite.tests[1].name).toBe('test2');
  });

  it('should support nested suites', () => {
    const suite = frameworkDescribe('Parent', () => {
      frameworkDescribe('Child', () => {
        frameworkIt('nested test', () => {});
      });
    });

    expect(suite.suites).toHaveLength(1);
    expect(suite.suites[0].name).toBe('Child');
    expect(suite.suites[0].tests).toHaveLength(1);
  });

  it('should support skip on describe', () => {
    const suite = frameworkDescribe.skip('Skipped', () => {
      frameworkIt('a test', () => {});
    });

    expect(suite.skip).toBe(true);
  });

  it('should support only on describe', () => {
    const suite = frameworkDescribe.only('Only', () => {
      frameworkIt('a test', () => {});
    });

    expect(suite.only).toBe(true);
  });

  it('should support hooks', () => {
    const suite = frameworkDescribe('Hooks', () => {
      beforeAll(() => {});
      afterAll(() => {});
      beforeEach(() => {});
      afterEach(() => {});
      frameworkIt('a test', () => {});
    });

    expect(suite.beforeAll).toHaveLength(1);
    expect(suite.afterAll).toHaveLength(1);
    expect(suite.beforeEach).toHaveLength(1);
    expect(suite.afterEach).toHaveLength(1);
  });

  it('should support test options (timeout, retries, tags)', () => {
    const suite = frameworkDescribe('Options', () => {
      frameworkIt('custom', () => {}, { timeout: 5000, retries: 3, tags: ['smoke'] });
    });

    const test = suite.tests[0];
    expect(test.timeout).toBe(5000);
    expect(test.retries).toBe(3);
    expect(test.tags).toEqual(['smoke']);
  });

  it('should support it.skip and it.only', () => {
    const suite = frameworkDescribe('ItModifiers', () => {
      frameworkIt.skip('skipped', () => {});
      frameworkIt.only('only', () => {});
    });

    expect(suite.tests[0].skip).toBe(true);
    expect(suite.tests[1].only).toBe(true);
  });
});

// ─── Page ───

describe('Page', () => {
  it('should navigate to a URL', async () => {
    const page = new Page();
    await page.goto('https://example.com');
    expect(page.getUrl()).toBe('https://example.com');
  });

  it('should track navigation history', async () => {
    const page = new Page();
    await page.goto('https://a.com');
    await page.goto('https://b.com');

    const history = page.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].url).toBe('https://a.com');
    expect(history[1].url).toBe('https://b.com');
  });

  it('should go back in history', async () => {
    const page = new Page();
    await page.goto('https://a.com');
    await page.goto('https://b.com');

    await page.goBack();
    expect(page.getUrl()).toBe('https://a.com');
  });

  it('should manage cookies', async () => {
    const page = new Page();
    await page.setCookie({ name: 'session', value: 'abc123' });

    const cookies = page.getCookies();
    expect(cookies).toHaveLength(1);
    expect(cookies[0].name).toBe('session');
    expect(cookies[0].value).toBe('abc123');

    await page.deleteCookie('session');
    expect(page.getCookies()).toHaveLength(0);
  });

  it('should take screenshots and return filenames', async () => {
    const page = new Page();
    const path1 = await page.screenshot();
    const path2 = await page.screenshot({ path: 'custom.png' });

    expect(path1).toContain('screenshot-1.png');
    expect(path2).toBe('custom.png');
  });

  it('should close and clear state', async () => {
    const page = new Page();
    await page.goto('https://example.com');
    await page.setCookie({ name: 'x', value: 'y' });

    await page.close();
    expect(page.getCookies()).toHaveLength(0);
    expect(page.getHistory()).toHaveLength(0);
  });

  it('should accept browser config', () => {
    const page = new Page({
      name: 'firefox',
      headless: false,
      viewport: { width: 800, height: 600 },
      timeout: 5000,
    });
    // Page was created without error
    expect(page.getUrl()).toBe('');
  });
});

// ─── Runner ───

describe('Runner', () => {
  it('should construct with options', () => {
    const runner = new Runner({
      browser: 'chromium',
      headless: true,
      parallel: 1,
      reporter: 'console',
      filter: '',
      timeout: 30000,
      retries: 0,
    });
    expect(runner).toBeDefined();
  });
});
