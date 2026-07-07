import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-redux',
    '@reduxjs/toolkit',
    '@reduxjs/toolkit/query',
    '@reduxjs/toolkit/query/react',
  ],
});
