import { describe, it, expect } from 'vitest';
import { analyzeRuns, type RunResult } from '../src/flaky/analyze';
import { loadRunResults } from '../src/flaky/parse';
import { resolve } from 'node:path';

function run(n: number, badge: 'passed' | 'failed'): RunResult {
  return {
    run: n,
    tests: [
      { name: 'estable', status: 'passed', durationMs: 100 },
      { name: 'flaky', status: badge, durationMs: 200 },
      { name: 'roto', status: 'failed', durationMs: 300 },
    ],
  };
}

describe('analyzeRuns (clasificación de flakiness)', () => {
  const runs = [run(1, 'passed'), run(2, 'failed'), run(3, 'passed')];

  it('clasifica un test que pasa y falla como flaky', () => {
    const health = analyzeRuns(runs);
    const flaky = health.tests.find((t) => t.name === 'flaky');
    expect(flaky?.classification).toBe('flaky');
    expect(flaky?.flakinessRate).toBeCloseTo(1 / 3);
  });

  it('clasifica un test que falla siempre como roto, NO flaky', () => {
    const health = analyzeRuns(runs);
    const roto = health.tests.find((t) => t.name === 'roto');
    expect(roto?.classification).toBe('broken');
  });

  it('clasifica un test que nunca falla como estable', () => {
    const health = analyzeRuns(runs);
    expect(health.tests.find((t) => t.name === 'estable')?.classification).toBe('stable');
  });

  it('calcula métricas de salud de la suite', () => {
    const health = analyzeRuns(runs);
    expect(health.totalTests).toBe(3);
    expect(health.flakyCount).toBe(1);
    expect(health.brokenCount).toBe(1);
  });
});

describe('integración con los fixtures reales (sample-results)', () => {
  it('detecta el badge del carrito como flaky y el reporte PDF como roto', () => {
    const health = analyzeRuns(loadRunResults(resolve('sample-results')));
    const badge = health.tests.find((t) => t.name === 'el badge del carrito se actualiza');
    const pdf = health.tests.find((t) => t.name === 'reporte de ventas exporta PDF');
    expect(badge?.classification).toBe('flaky');
    expect(pdf?.classification).toBe('broken');
  });
});
