import { describe, it, expect } from 'vitest';
import { applyDiscount } from '../src/discount';
describe('discount', () => {
  it('aplica descuento', () => expect(applyDiscount(100, 10)).toBe(90));
});
