/**
 * Motor de análisis de flakiness.
 *
 * A partir del histórico de resultados de varias corridas, clasifica cada test:
 *   - stable : nunca falló.
 *   - flaky  : a veces pasa y a veces falla (¡el problema a atacar!).
 *   - broken : falla SIEMPRE. Ojo: esto NO es flakiness, es un bug real o un test
 *              obsoleto. Distinguirlos evita tratar un fallo genuino como "ruido".
 * y calcula métricas de salud de la suite.
 */

export type TestStatus = 'passed' | 'failed' | 'skipped';

export interface TestResult {
  name: string;
  status: TestStatus;
  durationMs: number;
}

export interface RunResult {
  run: number;
  timestamp?: string;
  tests: TestResult[];
}

export type Classification = 'stable' | 'flaky' | 'broken';

export interface TestStats {
  name: string;
  runs: number;
  passed: number;
  failed: number;
  flakinessRate: number;
  avgDurationMs: number;
  classification: Classification;
}

export interface SuiteHealth {
  totalTests: number;
  flakyCount: number;
  brokenCount: number;
  flakyPercent: number;
  avgDurationMs: number;
  tests: TestStats[];
}

export function analyzeRuns(runs: RunResult[]): SuiteHealth {
  const byName = new Map<string, TestResult[]>();
  for (const run of runs) {
    for (const test of run.tests) {
      const list = byName.get(test.name) ?? [];
      list.push(test);
      byName.set(test.name, list);
    }
  }

  const tests: TestStats[] = [];
  for (const [name, results] of byName) {
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const runsCount = results.length;
    const avgDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0) / runsCount;

    let classification: Classification = 'stable';
    if (passed > 0 && failed > 0) classification = 'flaky';
    else if (passed === 0 && failed > 0) classification = 'broken';

    tests.push({
      name,
      runs: runsCount,
      passed,
      failed,
      flakinessRate: failed / runsCount,
      avgDurationMs,
      classification,
    });
  }

  const flakyCount = tests.filter((t) => t.classification === 'flaky').length;
  const brokenCount = tests.filter((t) => t.classification === 'broken').length;
  const divisor = tests.length || 1;

  return {
    totalTests: tests.length,
    flakyCount,
    brokenCount,
    flakyPercent: (flakyCount / divisor) * 100,
    avgDurationMs: tests.reduce((sum, t) => sum + t.avgDurationMs, 0) / divisor,
    tests,
  };
}
