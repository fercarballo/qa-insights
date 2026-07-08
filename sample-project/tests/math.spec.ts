import { describe, it, expect } from 'vitest';
import { add, multiply } from '../src/math';
describe('math', () => {
  it('suma', () => expect(add(2, 3)).toBe(5));
  it('multiplica', () => expect(multiply(2, 3)).toBe(6));
});
