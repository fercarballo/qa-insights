import { describe, it, expect } from 'vitest';
import { currency } from '../src/format';
describe('format', () => {
  it('formatea moneda', () => expect(currency(30)).toBe('$30.00'));
});
