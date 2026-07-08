import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

/**
 * Motor de grafo de dependencias.
 *
 * Recorre un proyecto, extrae los imports RELATIVOS de cada archivo de código y
 * los resuelve a rutas concretas, construyendo un grafo "archivo → archivos que
 * importa". Es la base del Test Impact Analysis: con este grafo se puede saber,
 * dado un archivo cambiado, qué tests dependen (directa o transitivamente) de él.
 */

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);

/** Grafo: ruta absoluta de un archivo → conjunto de rutas absolutas que importa. */
export type DependencyGraph = Map<string, Set<string>>;

function listCodeFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) listCodeFiles(full, acc);
    } else if (CODE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      acc.push(resolve(full));
    }
  }
  return acc;
}

// Cubre: import ... from 'x' | export ... from 'x' | import 'x' | require('x') | import('x')
const IMPORT_PATTERNS = [
  /(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g,
  /import\s*['"]([^'"]+)['"]/g,
  /(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

/** Extrae los especificadores de import RELATIVOS (./ o ../) de un contenido. */
export function extractRelativeImports(fileContent: string): string[] {
  const specifiers = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(fileContent)) !== null) {
      const spec = match[1];
      if (spec.startsWith('./') || spec.startsWith('../')) specifiers.add(spec);
    }
  }
  return [...specifiers];
}

/** Resuelve un especificador relativo a una ruta de archivo real (probando extensiones e index). */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    ...CODE_EXTENSIONS.map((ext) => base + ext),
    ...CODE_EXTENSIONS.map((ext) => join(base, `index${ext}`)),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return resolve(candidate);
  }
  return null;
}

export function buildDependencyGraph(rootDir: string): DependencyGraph {
  const files = listCodeFiles(resolve(rootDir));
  const graph: DependencyGraph = new Map();
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const deps = new Set<string>();
    for (const spec of extractRelativeImports(content)) {
      const resolved = resolveSpecifier(spec, file);
      if (resolved) deps.add(resolved);
    }
    graph.set(file, deps);
  }
  return graph;
}
