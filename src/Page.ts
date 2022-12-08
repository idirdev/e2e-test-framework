import { Selector, WaitCondition, Cookie, BrowserConfig } from './types';

interface ElementHandle {
  tag: string;
  text: string;
  attributes: Record<string, string>;
  visible: boolean;
}

interface NavigationEntry {
  url: string;
  timestamp: number;
}

export class Page {
  private currentUrl = '';
  private title = '';
  private cookies: Map<string, Cookie> = new Map();
  private elements: Map<string, ElementHandle> = new Map();
  private history: NavigationEntry[] = [];
  private screenshotCount = 0;
  private config: BrowserConfig;

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = {
      name: config.name ?? 'chromium',
      headless: config.headless ?? true,
      viewport: config.viewport ?? { width: 1280, height: 720 },
      timeout: config.timeout ?? 30000,
      slowMo: config.slowMo,
    };
  }

  async goto(url: string): Promise<void> {
    this.currentUrl = url;
    this.history.push({ url, timestamp: Date.now() });
    // In a real implementation, this would use the browser driver
    await this.simulateDelay(100);
  }

  async click(selector: Selector | string): Promise<void> {
    const sel = this.normalizeSelector(selector);
    await this.waitForSelector(sel);
    await this.simulateDelay(50);
  }

  async type(selector: Selector | string, text: string, options: { delay?: number; clear?: boolean } = {}): Promise<void> {
    const sel = this.normalizeSelector(selector);
    await this.waitForSelector(sel);

    if (options.clear) {
      // Clear existing text
    }

    const delay = options.delay ?? 0;
    for (const char of text) {
      await this.simulateDelay(delay);
    }
  }

  async getText(selector: Selector | string): Promise<string> {
    const sel = this.normalizeSelector(selector);
    const key = this.selectorKey(sel);
    const el = this.elements.get(key);
    return el?.text ?? '';
  }

  async getAttribute(selector: Selector | string, attribute: string): Promise<string | null> {
    const sel = this.normalizeSelector(selector);
    const key = this.selectorKey(sel);
    const el = this.elements.get(key);
    return el?.attributes[attribute] ?? null;
  }

  async waitFor(condition: WaitCondition): Promise<void> {
    const timeout = this.config.timeout;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      let met = false;

      switch (condition.type) {
        case 'visible':
          met = this.isElementVisible(condition.selector);
          break;
        case 'hidden':
          met = !this.isElementVisible(condition.selector);
          break;
        case 'url':
          met = typeof condition.pattern === 'string'
            ? this.currentUrl.includes(condition.pattern)
            : condition.pattern.test(this.currentUrl);
          break;
        case 'timeout':
          await this.simulateDelay(condition.ms);
          return;
        case 'networkIdle':
          await this.simulateDelay(500);
          return;
      }

      if (met) return;
      await this.simulateDelay(100);
    }

    throw new Error(`WaitFor condition not met within ${timeout}ms`);
  }

  async screenshot(options: { path?: string; fullPage?: boolean } = {}): Promise<string> {
    this.screenshotCount++;
    const filename = options.path ?? `screenshots/screenshot-${this.screenshotCount}.png`;
    // In a real implementation, this would capture the browser viewport
    await this.simulateDelay(200);
    return filename;
  }

  async evaluate<T>(fn: string | (() => T)): Promise<T> {
    // In a real implementation, this would run JS in the browser context
    await this.simulateDelay(50);
    return undefined as unknown as T;
  }

  getCookies(): Cookie[] {
    return Array.from(this.cookies.values());
  }

  async setCookie(cookie: Cookie): Promise<void> {
    this.cookies.set(cookie.name, cookie);
  }

  async deleteCookie(name: string): Promise<void> {
    this.cookies.delete(name);
  }

  getUrl(): string {
    return this.currentUrl;
  }

  getTitle(): string {
    return this.title;
  }

  getHistory(): NavigationEntry[] {
    return [...this.history];
  }

  async goBack(): Promise<void> {
    if (this.history.length > 1) {
      this.history.pop();
      this.currentUrl = this.history[this.history.length - 1].url;
    }
  }

  async reload(): Promise<void> {
    await this.goto(this.currentUrl);
  }

  async close(): Promise<void> {
    this.cookies.clear();
    this.elements.clear();
    this.history = [];
  }

  private normalizeSelector(selector: Selector | string): Selector {
    if (typeof selector === 'string') {
      return { type: 'css', value: selector };
    }
    return selector;
  }

  private selectorKey(selector: Selector): string {
    return `${selector.type}:${selector.value}`;
  }

  private async waitForSelector(selector: Selector): Promise<void> {
    await this.simulateDelay(10);
  }

  private isElementVisible(selector: Selector): boolean {
    const key = this.selectorKey(selector);
    const el = this.elements.get(key);
    return el?.visible ?? false;
  }

  private simulateDelay(ms: number): Promise<void> {
    const delay = this.config.slowMo ? ms + this.config.slowMo : ms;
    return new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10)));
  }
}
