import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const distHtml = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html');
const buildId = String(Date.now());

let html = fs.readFileSync(distHtml, 'utf8');
if (!html.includes('__BUILD_ID__')) {
  console.warn('stamp-build-id: __BUILD_ID__ not found in dist/index.html');
  process.exit(0);
}
html = html.replaceAll('__BUILD_ID__', buildId);
fs.writeFileSync(distHtml, html);
console.log(`stamp-build-id: ${buildId}`);
