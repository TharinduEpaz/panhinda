import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Support all projects
  dts: true,              // Generate .d.ts files (TypeScript types)
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', '@supabase/supabase-js'], // Don't bundle these
});