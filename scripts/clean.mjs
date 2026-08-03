import { rmSync } from 'node:fs';
for (const file of ['build/admin.js', 'build/admin.js.map', 'build/admin.css', 'build/admin-rtl.css', 'build/storefront.js', 'build/storefront.css', 'build/storefront-rtl.css']) rmSync(new URL(`../${file}`, import.meta.url), { force: true });
