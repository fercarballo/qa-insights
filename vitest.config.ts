import { defineConfig } from 'vitest/config';

// Solo se ejecutan los tests de la PROPIA herramienta (tests/), no los specs de
// sample-project/ (que son fixtures de demostración, no se corren).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
