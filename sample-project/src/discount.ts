import { multiply } from './math';
// discount.ts DEPENDE de math.ts (dependencia que el TIA debe seguir).
export const applyDiscount = (price: number, pct: number): number =>
  price - multiply(price, pct / 100);
