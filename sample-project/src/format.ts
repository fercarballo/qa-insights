// format.ts NO depende de math.ts: un cambio en math no debe afectar sus tests.
export const currency = (n: number): string => `$${n.toFixed(2)}`;
