#!/usr/bin/env node
/**
 * Bundle aiClassifier.js with @huggingface/transformers for the extension.
 * Run: npm run build  (after npm install)
 * Copies ONNX WASM files to lib/ if present.
 */
import * as esbuild from 'esbuild';
import { mkdir, cp } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await mkdir(path.join(__dirname, 'dist'), { recursive: true });
await mkdir(path.join(__dirname, 'lib'), { recursive: true });

await esbuild.build({
  entryPoints: [path.join(__dirname, 'aiClassifier.js')],
  bundle: true,
  outfile: path.join(__dirname, 'dist', 'aiClassifier.bundle.js'),
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
});

const onnxDist = path.join(__dirname, 'node_modules', 'onnxruntime-web', 'dist');
if (existsSync(onnxDist)) {
  const { readdir } = await import('fs/promises');
  const files = await readdir(onnxDist);
  for (const f of files) {
    if (f.endsWith('.wasm') || f.endsWith('.mjs')) {
      await cp(path.join(onnxDist, f), path.join(__dirname, 'lib', f)).catch(() => {});
    }
  }
}
console.log('AgileEmails: AI classifier bundle built at dist/aiClassifier.bundle.js');
