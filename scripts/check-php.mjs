import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['node_modules', '.git']);

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) return files(location);
    return location.endsWith('.php') ? [location] : [];
  });
}

let failed = false;
for (const file of files(root)) {
  const result = spawnSync('php', ['-l', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(result.stdout || result.stderr || `PHP syntax error: ${file}`);
  }
}
if (failed) process.exit(1);
console.log('PHP syntax check passed.');
