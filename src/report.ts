import type { SuiteHealth } from './flaky/analyze';

/** Formatea el análisis de flakiness como un reporte legible para consola. */
export function formatFlakyReport(health: SuiteHealth): string {
  const lines: string[] = [];
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

  lines.push('');
  lines.push('═══════════ SALUD DE LA SUITE ═══════════');
  lines.push(`  Tests analizados      : ${health.totalTests}`);
  lines.push(`  Flaky                 : ${health.flakyCount} (${health.flakyPercent.toFixed(0)}% de la suite)`);
  lines.push(`  Rotos (fallan siempre): ${health.brokenCount}`);
  lines.push(`  Duración promedio     : ${health.avgDurationMs.toFixed(0)}ms`);

  const flaky = health.tests
    .filter((t) => t.classification === 'flaky')
    .sort((a, b) => b.flakinessRate - a.flakinessRate);
  if (flaky.length > 0) {
    lines.push('');
    lines.push('⚠️  TESTS FLAKY (prioridad de arreglo):');
    for (const t of flaky) {
      lines.push(`   ${pct(t.flakinessRate).padStart(4)}  ${t.name}  (${t.passed}✓ / ${t.failed}✗ en ${t.runs} corridas)`);
    }
  }

  const broken = health.tests.filter((t) => t.classification === 'broken');
  if (broken.length > 0) {
    lines.push('');
    lines.push('❌ TESTS ROTOS (fallan siempre — NO es flakiness, es un bug real o test obsoleto):');
    for (const t of broken) lines.push(`   ${t.name}`);
  }

  const slowest = [...health.tests].sort((a, b) => b.avgDurationMs - a.avgDurationMs).slice(0, 3);
  lines.push('');
  lines.push('🐢 MÁS LENTOS:');
  for (const t of slowest) {
    lines.push(`   ${`${t.avgDurationMs.toFixed(0)}ms`.padStart(7)}  ${t.name}`);
  }
  lines.push('');

  return lines.join('\n');
}
