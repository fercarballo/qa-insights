import { resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { buildDependencyGraph } from './impact/dependency-graph';
import { affectedTests, isTestFile } from './impact/test-impact';
import { loadRunResults } from './flaky/parse';
import { analyzeRuns } from './flaky/analyze';
import { formatFlakyReport } from './report';

/**
 * CLI de qa-insights. Dos comandos:
 *   impact --project <ruta> --changed <f1,f2,...> | --since <git-ref>
 *   flaky  --results <directorio>
 */

function getFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function commandImpact(args: string[]): void {
  const project = getFlag(args, 'project') ?? '.';
  const changedFlag = getFlag(args, 'changed');
  const since = getFlag(args, 'since');

  let changed: string[];
  if (changedFlag) {
    changed = changedFlag.split(',').map((s) => resolve(s.trim()));
  } else if (since) {
    const diff = execSync(`git -C ${project} diff --name-only ${since}`, { encoding: 'utf-8' });
    changed = diff.split('\n').filter(Boolean).map((f) => resolve(project, f));
  } else {
    console.error('Falta --changed <archivos separados por coma> o --since <git-ref>');
    process.exitCode = 1;
    return;
  }

  const graph = buildDependencyGraph(project);
  const allTests = [...graph.keys()].filter(isTestFile);
  const affected = affectedTests(graph, changed);

  console.log(`\nArchivos cambiados : ${changed.length}`);
  console.log(`Tests en el proyecto: ${allTests.length}`);
  console.log(`Tests AFECTADOS     : ${affected.length}  (se evita correr ${allTests.length - affected.length})\n`);
  for (const test of affected) console.log(`   • ${relative(process.cwd(), test)}`);
  if (affected.length > 0) {
    const list = affected.map((t) => relative(process.cwd(), t)).join(' ');
    console.log(`\nComando sugerido:\n   npx playwright test ${list}\n`);
  } else {
    console.log('\nNingún test afectado por estos cambios.\n');
  }
}

function commandFlaky(args: string[]): void {
  const dir = getFlag(args, 'results');
  if (!dir) {
    console.error('Falta --results <directorio con los JSON de las corridas>');
    process.exitCode = 1;
    return;
  }
  const runs = loadRunResults(dir);
  console.log(formatFlakyReport(analyzeRuns(runs)));
}

const [command, ...args] = process.argv.slice(2);
if (command === 'impact') commandImpact(args);
else if (command === 'flaky') commandFlaky(args);
else {
  console.log(
    [
      'qa-insights — herramienta interna de QA',
      '',
      'Comandos:',
      '  impact --project <ruta> --changed <f1,f2> | --since <git-ref>',
      '  flaky  --results <directorio>',
    ].join('\n'),
  );
}
