# WooOptionsFic React + TypeScript development

WooOptionsFic `0.9.0-beta.30` contains genuine, readable React + TypeScript source for the administration application. The generated `build/admin.js` file is created from the `.tsx` files under `resources/admin/`; it is not the source of truth.

## Requirements

- WordPress and WooCommerce in a local development site
- PHP 8.1 or newer
- Node.js 18 or newer
- npm
- A code editor such as VS Code or PhpStorm

## Install locally

Place the plugin at:

```text
C:\Users\User\Local Sites\themefictest\app\public\wp-content\plugins\wooptionsfic
```

Open PowerShell in the plugin directory:

```powershell
cd "C:\Users\User\Local Sites\themefictest\app\public\wp-content\plugins\wooptionsfic"
npm install
npm run build
```

Activate WooOptionsFic from WordPress after the build completes.

## Development watcher

```powershell
npm run dev
```

The watcher recompiles the TSX application and copies storefront/CSS source files into `build/`.

## Commands

```powershell
npm run typecheck
npm run build
npm run dev
npm run check
npm run check:php
```

## Source structure

```text
resources/
├── admin/
│   ├── app.tsx
│   ├── index.tsx
│   ├── types/
│   │   ├── globals.d.ts
│   │   └── models.ts
│   ├── core/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── store/
│   │   └── builder-store.ts
│   ├── components/
│   │   ├── common.tsx
│   │   ├── icons.tsx
│   │   └── shell.tsx
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── option-sets.tsx
│   │   ├── templates.tsx
│   │   ├── analytics.tsx
│   │   └── system-pages.tsx
│   └── builder/
│       ├── builder.tsx
│       ├── canvas.tsx
│       ├── elements-panel.tsx
│       ├── inspector.tsx
│       ├── field-preview.tsx
│       ├── field-factory.ts
│       ├── logic-editor.tsx
│       ├── style-studio.tsx
│       ├── history-modal.tsx
│       └── assignments-modal.tsx
├── storefront/
│   └── index.js
└── styles/
    ├── admin.css
    └── storefront.css
```

## Architecture

The builder mounts one React root on WooOptionsFic admin pages. WordPress supplies React, the component library, the data package, translations, and REST transport through the `wp` runtime.

The admin application uses:

- React function components written in TSX
- strict TypeScript models for option sets, fields, choices, rules, revisions, and assignments
- a namespaced `wp.data` store: `wooptionsfic/builder`
- immutable document updates with bounded undo/redo history
- debounced validation and autosave
- REST services isolated in `resources/admin/core/api.ts`
- PHP-authoritative publishing, rules, uploads, and storefront pricing

The TypeScript compiler emits one browser file because WordPress already provides the external runtime dependencies. `build/admin.asset.php` declares those dependencies explicitly.

## Editing guide

Builder layout and workflow:

```text
resources/admin/builder/builder.tsx
```

Elements palette:

```text
resources/admin/builder/elements-panel.tsx
resources/admin/builder/field-factory.ts
```

Product-page canvas:

```text
resources/admin/builder/canvas.tsx
resources/admin/builder/field-preview.tsx
```

Inspector, choices, pricing, style, and advanced settings:

```text
resources/admin/builder/inspector.tsx
resources/admin/builder/style-studio.tsx
```

Conditional logic:

```text
resources/admin/builder/logic-editor.tsx
```

Option Sets table and pagination:

```text
resources/admin/pages/option-sets.tsx
```

REST calls:

```text
resources/admin/core/api.ts
```

Shared TypeScript data models:

```text
resources/admin/types/models.ts
```

Admin styling:

```text
resources/styles/admin.css
```

Storefront behavior and styling:

```text
resources/storefront/index.js
resources/styles/storefront.css
```

## Build output

Do not permanently edit these generated files:

```text
build/admin.js
build/admin.js.map
build/admin.asset.php
build/storefront.js
build/storefront.asset.php
build/*.css
```

Run `npm run build` after editing TypeScript, JavaScript, or CSS.

PHP and JSON configuration changes do not require an npm build, although browser and WordPress caches may need clearing.
