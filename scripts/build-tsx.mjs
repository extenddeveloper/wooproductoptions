import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tsc = process.platform === 'win32' ? resolve(root, 'node_modules/.bin/tsc.cmd') : resolve(root, 'node_modules/.bin/tsc');
const compiler = (() => {
  try { return tsc; } catch { return 'tsc'; }
})();
mkdirSync(resolve(root, 'build'), { recursive: true });
try {
  execFileSync(compiler, ['-p', resolve(root, 'tsconfig.admin.json')], { stdio: 'inherit' });
} catch (error) {
  if (compiler !== 'tsc') execFileSync('tsc', ['-p', resolve(root, 'tsconfig.admin.json')], { stdio: 'inherit' });
  else throw error;
}
const copies = [
  ['resources/storefront/index.js', 'build/storefront.js'],
  ['resources/styles/admin.css', 'build/admin.css'],
  ['resources/styles/admin-rtl.css', 'build/admin-rtl.css'],
  ['resources/styles/storefront.css', 'build/storefront.css'],
  ['resources/styles/storefront-rtl.css', 'build/storefront-rtl.css']
];
for (const [source, target] of copies) {
  const sourcePath = resolve(root, source);
  const targetPath = resolve(root, target);
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}
const digest = (paths) => {
  const hash = createHash('sha256');
  for (const path of paths) hash.update(readFileSync(resolve(root, path)));
  return hash.digest('hex').slice(0, 20);
};
const adminVersion = digest(['build/admin.js', 'build/admin.css']);
const storefrontVersion = digest(['build/storefront.js', 'build/storefront.css']);
writeFileSync(resolve(root, 'build/admin.asset.php'), `<?php return array('dependencies' => array('react', 'react-dom', 'wp-api-fetch', 'wp-components', 'wp-data', 'wp-element', 'wp-i18n'), 'version' => '${adminVersion}');\n`);
writeFileSync(resolve(root, 'build/storefront.asset.php'), `<?php return array('dependencies' => array(), 'version' => '${storefrontVersion}');\n`);
console.log(`Built WooOptionsFic TSX assets (${adminVersion}).`);
