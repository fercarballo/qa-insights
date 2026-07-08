import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RunResult } from './analyze';

/**
 * Carga los resultados de corridas desde un directorio de archivos JSON.
 *
 * Cada archivo es una corrida con el formato { run, timestamp, tests: [...] }.
 * En un uso real, un adaptador convertiría el reporter JSON de Playwright (o
 * JUnit XML) a este formato normalizado; acá los consumimos ya normalizados.
 */
export function loadRunResults(dir: string): RunResult[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf-8')) as RunResult);
}
