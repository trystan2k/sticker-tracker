import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const currentFileName = fileURLToPath(import.meta.url);
const currentDirName = dirname(currentFileName);
const rootDir = resolve(currentDirName, '..');
const require = createRequire(import.meta.url);

const publicCoreDir = resolve(rootDir, 'public/ocr-core');
const publicLangDir = resolve(rootDir, 'public/ocr-lang');

const corePackageJsonPath = require.resolve('tesseract.js-core/package.json');
const coreSourceDir = dirname(corePackageJsonPath);
const langPackageJsonPath = require.resolve('@tesseract.js-data/eng/package.json');
const langSourceFile = resolve(dirname(langPackageJsonPath), '4.0.0_best_int/eng.traineddata.gz');

if (!existsSync(coreSourceDir)) {
  throw new Error('Missing tesseract.js-core package. Install dependencies first.');
}

if (!existsSync(langSourceFile)) {
  throw new Error('Missing @tesseract.js-data/eng language data. Install dependencies first.');
}

mkdirSync(publicCoreDir, { recursive: true });
mkdirSync(publicLangDir, { recursive: true });

const coreFiles = [
  'tesseract-core.wasm.js',
  'tesseract-core.wasm',
  'tesseract-core-simd.wasm.js',
  'tesseract-core-simd.wasm',
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-lstm.wasm',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm',
  'tesseract-core-relaxedsimd.wasm.js',
  'tesseract-core-relaxedsimd.wasm',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm'
];

for (const fileName of coreFiles) {
  cpSync(resolve(coreSourceDir, fileName), resolve(publicCoreDir, fileName));
}

cpSync(langSourceFile, resolve(publicLangDir, 'eng.traineddata.gz'));
