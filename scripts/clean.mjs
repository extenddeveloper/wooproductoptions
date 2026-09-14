import { rmSync } from 'node:fs';
for (const file of ['build/admin.js', 'build/admin.js.map', 'build/admin.css', 'build/storefront.js', 'build/storefront.css']) rmSync(new URL(`../${file}`, import.meta.url), { force: true });
