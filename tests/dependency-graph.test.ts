import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { buildDependencyGraph, extractRelativeImports } from '../src/impact/dependency-graph';

const SAMPLE = resolve('sample-project');

describe('extractRelativeImports', () => {
  it('detecta imports relativos e ignora paquetes', () => {
    const code = `
      import { a } from './local';
      import x from '../otro/modulo';
      import 'side-effect-local' ;
      import { b } from 'vitest';
      const y = require('./req');
    `;
    const specs = extractRelativeImports(code);
    expect(specs).toContain('./local');
    expect(specs).toContain('../otro/modulo');
    expect(specs).toContain('./req');
    expect(specs).not.toContain('vitest');
  });
});

describe('buildDependencyGraph', () => {
  it('resuelve la dependencia discount.ts → math.ts', () => {
    const graph = buildDependencyGraph(SAMPLE);
    const discount = resolve(SAMPLE, 'src/discount.ts');
    const math = resolve(SAMPLE, 'src/math.ts');

    expect(graph.has(discount)).toBe(true);
    expect([...(graph.get(discount) ?? [])]).toContain(math);
  });

  it('format.ts no depende de math.ts', () => {
    const graph = buildDependencyGraph(SAMPLE);
    const format = resolve(SAMPLE, 'src/format.ts');
    const math = resolve(SAMPLE, 'src/math.ts');
    expect([...(graph.get(format) ?? [])]).not.toContain(math);
  });
});
