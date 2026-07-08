import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { buildDependencyGraph } from '../src/impact/dependency-graph';
import { affectedTests } from '../src/impact/test-impact';

const SAMPLE = resolve('sample-project');
const rel = (p: string) => resolve(SAMPLE, p);

describe('affectedTests (Test Impact Analysis)', () => {
  it('un cambio en math.ts afecta a math.spec y discount.spec (transitivo), NO a format.spec', () => {
    const graph = buildDependencyGraph(SAMPLE);
    const affected = affectedTests(graph, [rel('src/math.ts')]);

    expect(affected).toContain(rel('tests/math.spec.ts'));
    expect(affected).toContain(rel('tests/discount.spec.ts')); // transitivo: discount → math
    expect(affected).not.toContain(rel('tests/format.spec.ts'));
  });

  it('un cambio en format.ts afecta solo a format.spec', () => {
    const graph = buildDependencyGraph(SAMPLE);
    const affected = affectedTests(graph, [rel('src/format.ts')]);

    expect(affected).toEqual([rel('tests/format.spec.ts')]);
  });

  it('cambiar un test lo incluye directamente', () => {
    const graph = buildDependencyGraph(SAMPLE);
    const affected = affectedTests(graph, [rel('tests/math.spec.ts')]);
    expect(affected).toContain(rel('tests/math.spec.ts'));
  });

  it('un cambio sin relación no afecta ningún test', () => {
    const graph = buildDependencyGraph(SAMPLE);
    const affected = affectedTests(graph, [rel('src/inexistente.ts')]);
    expect(affected).toHaveLength(0);
  });
});
