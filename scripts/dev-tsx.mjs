import { spawn } from 'node:child_process';
import { copyFileSync, watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const binary = process.platform === 'win32' ? resolve(root, 'node_modules/.bin/tsc.cmd') : resolve(root, 'node_modules/.bin/tsc');
const child = spawn(binary, ['-p', resolve(root, 'tsconfig.admin.json'), '--watch', '--preserveWatchOutput'], { stdio: 'inherit', shell: process.platform === 'win32' });
const copyStatic = () => {
  const files = [
    ['resources/storefront/index.js', 'build/storefront.js'],
    ['resources/styles/admin.css', 'build/admin.css'],
    ['resources/styles/storefront.css', 'build/storefront.css']
  ];
  for (const [source, target] of files) copyFileSync(resolve(root, source), resolve(root, target));
};
copyStatic();
for (const folder of ['resources/styles', 'resources/storefront']) watch(resolve(root, folder), { recursive: true }, copyStatic);
process.on('SIGINT', () => { child.kill('SIGINT'); process.exit(0); });
