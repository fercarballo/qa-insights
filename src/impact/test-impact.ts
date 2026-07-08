import { resolve } from 'node:path';
import type { DependencyGraph } from './dependency-graph';

/**
 * Test Impact Analysis.
 *
 * Dado el grafo de dependencias y la lista de archivos cambiados, determina qué
 * tests están AFECTADOS: aquellos que cambiaron ellos mismos, o que dependen
 * (transitivamente) de algún archivo cambiado. Correr solo ese subconjunto en un
 * PR reduce drásticamente el tiempo de feedback sin perder cobertura sobre lo tocado.
 */

const TEST_PATTERN = /\.(spec|test)\.[cm]?[jt]sx?$/;

export function isTestFile(file: string): boolean {
  return TEST_PATTERN.test(file);
}

/** Cierre transitivo de dependencias de un archivo (todo lo que importa, en cadena). */
function transitiveDependencies(graph: DependencyGraph, start: string): Set<string> {
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const dep of graph.get(current) ?? []) {
      if (!visited.has(dep)) {
        visited.add(dep);
        stack.push(dep);
      }
    }
  }
  return visited;
}

export function affectedTests(graph: DependencyGraph, changedFiles: string[]): string[] {
  const changed = new Set(changedFiles.map((f) => resolve(f)));
  const affected: string[] = [];

  for (const file of graph.keys()) {
    if (!isTestFile(file)) continue;

    // 1. El test cambió directamente.
    if (changed.has(file)) {
      affected.push(file);
      continue;
    }
    // 2. El test depende (transitivamente) de un archivo cambiado.
    const deps = transitiveDependencies(graph, file);
    for (const dep of deps) {
      if (changed.has(dep)) {
        affected.push(file);
        break;
      }
    }
  }

  return affected.sort();
}
