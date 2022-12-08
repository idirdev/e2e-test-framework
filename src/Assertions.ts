import { TestError } from './types';

class AssertionError extends Error {
  expected: unknown;
  received: unknown;

  constructor(message: string, expected: unknown, received: unknown) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.received = received;
  }
}

const softErrors: AssertionError[] = [];

export function getSoftErrors(): AssertionError[] {
  return [...softErrors];
}

export function clearSoftErrors(): void {
  softErrors.length = 0;
}

export function flushSoftErrors(): void {
  if (softErrors.length > 0) {
    const messages = softErrors.map((e) => e.message).join('\n');
    softErrors.length = 0;
    throw new AssertionError(`Soft assertion failures:\n${messages}`, undefined, undefined);
  }
}

class Expectation<T> {
  private negated = false;
  private soft = false;

  constructor(private value: T) {}

  get not(): this {
    this.negated = true;
    return this;
  }

  get softly(): this {
    this.soft = true;
    return this;
  }

  private assert(condition: boolean, message: string, expected: unknown, received: unknown): void {
    const pass = this.negated ? !condition : condition;
    if (!pass) {
      const fullMessage = this.negated ? `NOT: ${message}` : message;
      const err = new AssertionError(fullMessage, expected, received);
      if (this.soft) {
        softErrors.push(err);
      } else {
        throw err;
      }
    }
  }

  toBe(expected: T): void {
    this.assert(
      Object.is(this.value, expected),
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(this.value)}`,
      expected,
      this.value
    );
  }

  toEqual(expected: T): void {
    const isEqual = JSON.stringify(this.value) === JSON.stringify(expected);
    this.assert(isEqual, `Expected deep equal to ${JSON.stringify(expected)}, received ${JSON.stringify(this.value)}`, expected, this.value);
  }

  toContain(item: unknown): void {
    if (typeof this.value === 'string') {
      this.assert((this.value as string).includes(item as string), `Expected "${this.value}" to contain "${item}"`, item, this.value);
    } else if (Array.isArray(this.value)) {
      this.assert(this.value.includes(item), `Expected array to contain ${JSON.stringify(item)}`, item, this.value);
    } else {
      this.assert(false, 'toContain can only be used with strings and arrays', 'string|array', typeof this.value);
    }
  }

  toBeTruthy(): void {
    this.assert(!!this.value, `Expected truthy, received ${JSON.stringify(this.value)}`, 'truthy', this.value);
  }

  toBeFalsy(): void {
    this.assert(!this.value, `Expected falsy, received ${JSON.stringify(this.value)}`, 'falsy', this.value);
  }

  toBeNull(): void {
    this.assert(this.value === null, `Expected null, received ${JSON.stringify(this.value)}`, null, this.value);
  }

  toBeUndefined(): void {
    this.assert(this.value === undefined, `Expected undefined, received ${JSON.stringify(this.value)}`, undefined, this.value);
  }

  toBeDefined(): void {
    this.assert(this.value !== undefined, `Expected defined value, received undefined`, 'defined', this.value);
  }

  toHaveLength(length: number): void {
    const actual = (this.value as any)?.length;
    this.assert(actual === length, `Expected length ${length}, received ${actual}`, length, actual);
  }

  toMatch(pattern: RegExp | string): void {
    const str = String(this.value);
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    this.assert(regex.test(str), `Expected "${str}" to match ${regex}`, pattern, str);
  }

  toThrow(messageOrPattern?: string | RegExp): void {
    let threw = false;
    let thrownError: unknown;

    try {
      if (typeof this.value === 'function') {
        (this.value as Function)();
      }
    } catch (err) {
      threw = true;
      thrownError = err;
    }

    this.assert(threw, 'Expected function to throw', 'throw', 'no throw');

    if (threw && messageOrPattern) {
      const msg = thrownError instanceof Error ? thrownError.message : String(thrownError);
      if (typeof messageOrPattern === 'string') {
        this.assert(msg.includes(messageOrPattern), `Expected error message to contain "${messageOrPattern}", got "${msg}"`, messageOrPattern, msg);
      } else {
        this.assert(messageOrPattern.test(msg), `Expected error message to match ${messageOrPattern}, got "${msg}"`, messageOrPattern, msg);
      }
    }
  }

  toBeGreaterThan(n: number): void {
    this.assert((this.value as number) > n, `Expected ${this.value} > ${n}`, `> ${n}`, this.value);
  }

  toBeLessThan(n: number): void {
    this.assert((this.value as number) < n, `Expected ${this.value} < ${n}`, `< ${n}`, this.value);
  }

  toBeInstanceOf(cls: Function): void {
    this.assert(this.value instanceof cls, `Expected instance of ${cls.name}`, cls.name, typeof this.value);
  }

  toSatisfy(predicate: (value: T) => boolean, message?: string): void {
    this.assert(predicate(this.value), message ?? 'Custom predicate failed', 'predicate pass', this.value);
  }
}

export function expect<T>(value: T): Expectation<T> {
  return new Expectation(value);
}

export function addMatcher<T>(name: string, matcher: (received: T, ...args: any[]) => { pass: boolean; message: string }): void {
  (Expectation.prototype as any)[name] = function (this: Expectation<T>, ...args: any[]) {
    const result = matcher((this as any).value, ...args);
    (this as any).assert(result.pass, result.message, args[0], (this as any).value);
  };
}
