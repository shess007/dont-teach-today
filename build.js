import * as esbuild from 'esbuild';
import { mkdirSync, cpSync, existsSync } from 'fs';

// Ensure public directory exists
mkdirSync('public', { recursive: true });

// Bundle client JS
await esbuild.build({
  entryPoints: ['src/client/main.js'],
  bundle: true,
  format: 'esm',
  outfile: 'public/client.js',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
});

// Copy static assets to public/
cpSync('assets', 'public/assets', { recursive: true });
cpSync('css', 'public/css', { recursive: true });
cpSync('index.html', 'public/index.html');

console.log('Client build complete!');
