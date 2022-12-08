import { Selector } from '../types';

export function byTestId(id: string): Selector {
  return { type: 'testid', value: id };
}

export function byRole(role: string, options?: { name?: string }): Selector {
  const value = options?.name ? `${role}[name="${options.name}"]` : role;
  return { type: 'role', value };
}

export function byText(text: string, options?: { exact?: boolean }): Selector {
  const value = options?.exact === false ? `*${text}*` : text;
  return { type: 'text', value };
}

export function byPlaceholder(placeholder: string): Selector {
  return { type: 'placeholder', value: placeholder };
}

export function xpath(expression: string): Selector {
  return { type: 'xpath', value: expression };
}

export function css(selector: string): Selector {
  return { type: 'css', value: selector };
}

export function toNativeSelector(selector: Selector): string {
  switch (selector.type) {
    case 'css':
      return selector.value;
    case 'xpath':
      return `xpath=${selector.value}`;
    case 'testid':
      return `[data-testid="${selector.value}"]`;
    case 'role':
      return `[role="${selector.value}"]`;
    case 'text':
      return `:text("${selector.value}")`;
    case 'placeholder':
      return `[placeholder="${selector.value}"]`;
    default:
      return selector.value;
  }
}
