# Administration TSX architecture

## Runtime boundary

WooOptionsFic mounts one React root inside `#wooptionsfic-admin-root`. React and WordPress packages are not bundled twice; WordPress supplies them through `wp.element`, `wp.components`, `wp.data`, `wp.apiFetch`, and `wp.i18n`.

## State boundary

The `wooptionsfic/builder` data store owns the current option-set document, selection, device, inspector tab, validation issues, save status, and bounded undo/redo snapshots. Components dispatch typed document commands rather than mutating nested data directly.

## Server boundary

`core/api.ts` is the only administration REST transport. The builder never calculates authoritative WooCommerce prices or publishes directly to storage. Drafts, validation, publishing, assignments, revision history, imports, and exports pass through capability-protected REST endpoints and PHP services.

## Component boundary

- `BuilderPage` coordinates loading, autosave, validation, publishing, and modal workflows.
- `ElementsPanel` creates typed fields and supports click/drag insertion.
- `Canvas` is a product-page-like visual editor and uses the selected palette/typography.
- `Inspector` edits field content, choices, pricing, logic, style, and advanced settings.
- `LogicEditor` authors grouped conditions compatible with the PHP rule engine.
- `HistoryModal` restores revisions by creating a new draft copy.
- `AssignmentsModal` searches and selects multiple products, variations, categories, and tags.

## Build

`tsconfig.admin.json` compiles the ordered TSX source tree to `build/admin.js` with a source map. The runtime dependency list is generated in `build/admin.asset.php`.
