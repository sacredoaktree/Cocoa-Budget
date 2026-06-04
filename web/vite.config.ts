import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Re-anchors bare imports (zustand, date-fns, …) from shared ../src/ files
// so they resolve from web/node_modules instead of the root node_modules
// (which may not exist on machines that only ran npm install inside web/).
function resolveSharedDeps(): Plugin {
  const sharedSrcDir = path.resolve(__dirname, '../src');
  const fakeImporter  = path.resolve(__dirname, 'src/_shim.ts');

  return {
    name: 'resolve-shared-deps',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer) return null;
      if (!importer.startsWith(sharedSrcDir)) return null;
      if (source.startsWith('.') || source.startsWith('/')) return null;

      // Re-resolve from inside web/src/ so Vite searches web/node_modules
      return this.resolve(source, fakeImporter, { skipSelf: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), resolveSharedDeps()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../src'),
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
      },
    },
  },
});
