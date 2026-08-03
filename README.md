# WooOptionsFic

WooOptionsFic 0.9.0-beta.29 is an installable, staging-oriented WooCommerce product-options plugin. It provides a polished WordPress-native React administration experience and an accessible server-rendered storefront whose selections, rules, formulas, linked products, uploads, and prices are revalidated by PHP.

## Requirements

- WordPress 6.9 or newer
- PHP 8.1 or newer
- WooCommerce 9.0 or newer for commerce features
- HTTPS is strongly recommended for customer uploads and shared configurations

## Quick start

1. Upload and activate the release ZIP from **Plugins > Add New > Upload Plugin**.
2. Open **WooOptionsFic > Templates** and import a starter, or open **Option Sets** and create one.
3. Add and configure fields in the Precision Workshop.
4. Open **Assign**, add at least one include assignment, and save it.
5. Resolve all preflight errors and choose **Publish**.
6. Open the matching product page, exercise each field, and add a configured item to the cart.
7. Confirm the price, linked child items, option summary, and private upload links in a test order.

## Security model

- Add-to-cart prices are calculated from the current product context and normalized selections on the server.
- Published revisions are immutable; orders store standalone snapshots.
- Formula text is parsed into a bounded AST and is never passed to `eval`.
- Free-text and secret values are excluded from analytics; secret-mode values are removed from persistent snapshots.
- File uploads are size-, extension-, detected-MIME-, image-dimension-, ownership-, product-, variation-, field-, row-, and revision-bound.
- Share URLs contain random tokens, not raw selections.

## Local development

This source workspace includes editable assets in `resources/` and dependency-free build scripts. Start with:

```bash
npm install
npm run build
npm run dev
```

Run syntax checks with:

```bash
npm run check
```

See `DEVELOPMENT.md` and `SOURCE-NOTES.md` before changing the JavaScript application. Runtime files remain under `src/`, `config/`, `templates/`, `blocks/`, and `build/`.

## Data retention

Deactivation removes the scheduled cleanup event but retains data. Uninstall also retains data by default. To remove plugin tables and private files on uninstall, enable the setting first or define:

```php
define('WOOPTIONSFIC_REMOVE_DATA', true);
```

See `docs/USER_GUIDE.md`, `docs/DEVELOPER_HOOKS.md`, `docs/RELEASE_QA.md`, and `docs/KNOWN_LIMITATIONS.md` for test and extension details.
