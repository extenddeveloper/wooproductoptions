# Changelog

## 0.9.0-beta.30 — 2026-08-07

- Rebuilt the Templates page as a modern template marketplace matching the approved design.
- Added searchable categories, feature filters, sorting, favorites, previews, and pagination.
- Added working create-from-scratch and JSON template-import actions.
- Added ten original bundled SVG template preview illustrations.
- Expanded template metadata with categories, feature flags, usage, and popularity.


## 0.9.0-beta.29 — 2026-08-03

- Added insertion-aware drag and drop across existing canvas fields, with full-canvas and before/after drop highlighting.
- Added an Image Swatches option to update the main WooCommerce product image when a swatch is selected.
- Added WordPress ColorPicker controls for color swatches and improved Color Picker field rendering in the builder and storefront.
- Repaired canvas previews for private file upload, textarea, and dropdown fields.

## 0.9.0-beta.28 — 2026-08-03

- Restored the beta.25 Version History version-browser interface in readable TSX.
- Restored the beta.25 product-assignment picker, searchable target tabs, assignment cards, and modal actions in readable TSX.
- Corrected assignment types to use the backend-supported global, product, variation, category, tag, and product-type contract.
- Restored saved choice-image thumbnails after reopening the builder by resolving WordPress Media Library attachment IDs.
- Persisted attachment-backed image URLs during definition normalization and added a safe frontend image fallback.
- Restored image previews in the live builder canvas after reload.

## 0.9.0-beta.27 — 2026-08-03

- Restored the polished beta.25 Option Sets manager styling in the new TSX application.
- Replaced raw bulk-action controls with WordPress component buttons and restored managed table, loading overlay, row menu, checkbox, and DataTables-style pagination markup.
- Rebuilt conditional logic as readable TSX with the previous multi-group AND/OR editor, show/hide behavior, choice-aware values, and compact rule cards.
- Restored field-level condition serialization used by the storefront compiler.

## 0.9.0-beta.26 — 2026-08-03

- Replaced the reconstructed admin bundle with genuine readable React + TypeScript source.
- Added strict option-set, field, choice, rule, revision, assignment, and builder-state models.
- Added a namespaced WordPress data store with immutable edits and bounded undo/redo.
- Split dashboard, Option Sets, templates, builder, canvas, inspector, logic, style, history, and assignments into maintainable TSX components.
- Added TypeScript compilation, source maps, local watcher, dependency metadata generation, and developer architecture documentation.

## 0.9.0-beta.25 — 2026-08-03

- Restored 10 option sets per page as the default.
- Added an always-visible DataTables-style pagination footer.
- Added a per-page selector for 10, 25, 50, or 100 rows.
- Pagination now shows Previous, page numbers, Next, and the result range even when only one page exists.

## 0.9.0-beta.24 — 2026-08-03

- Changed the Option Sets list to 5 rows per page so pagination appears once there are more than five matching sets.
- Simplified the Options applied column to display only the numeric field count.

## 0.9.0-beta.23 — 2026-08-03

- Fixed option-set field counts in the library by reading the current draft or published revision.
- Added individual and bulk JSON export.
- Added activate, deactivate, archive, restore, and permanent-delete actions.
- Added AJAX pagination, loading overlays, select-all, and a modern row-action menu.

## 0.9.0-beta.22 — 2026-08-03

- Loaded every selectable typography family in the builder so the live canvas renders Inter, Manrope, Poppins, Outfit, Plus Jakarta Sans, and Roboto accurately.
- Added complete font stacks and improved text rendering for the builder canvas.
- Strengthened the scoped storefront palette contract so theme form CSS cannot override WooOptionsFic colors.
- Improved cached-page palette recovery and dark-palette native control rendering.
- Hardened frontend Google Fonts URL generation and dynamic font loading.

## 0.9.0-beta.21 — 2026-08-03

- Fixed itemized breakdown rows for select and radio choices, including zero-price selections and selected-choice labels.
- Enabled secure share links for guest session-owned saved configurations and improved storefront share errors.
- Applied effective color palette and typography from quote responses so cached product HTML self-corrects.
- Added supported font loading and frontend typography variables.

## 0.9.0-beta.20 — 2026-08-03

- Fixed effective frontend configuration caching so newly published revisions and summary settings take effect immediately.
- Returned effective settings with every quote so cached product HTML self-corrects without waiting for a full-page cache purge.
- Restored itemized price rows, sticky summary behavior, and saved-configuration visibility, including merged option-set assignments.
- Made sticky summaries render before the fields and dynamically reorder when current settings arrive from the server.
- Prevented publish/autosave races from publishing an older draft.
- Updated Version History modal header spacing.

## 0.9.0-beta.19 — 2026-08-03

- Enforced price-breakdown, sticky-summary, and saved-configuration settings in both server-rendered markup and the storefront runtime.
- Added token/session retry support when saving customer configurations.
- Removed empty price-breakdown spacing when itemized rows are disabled.
- Updated palette label typography and reduced canvas toolbar button height to 30px.

## 0.9.0-beta.18 — 2026-08-02

- Added real thumbnail previews for successfully uploaded images in the storefront uploader.
- Added file-type-aware icons for PDF, text, CSV/spreadsheet, audio, video, archive, and generic files.
- Added safe object-URL cleanup when uploaded items are removed or replaced.

## 0.9.0-beta.17 — 2026-08-02

- Fixed anonymous upload sessions by creating the first-party guest identity on demand and retrying stale upload sessions with a refreshed public token.
- Fixed the Assignments modal runtime crash caused by a state-hook name collision.
- Rebuilt Version History as a cleaner modern version browser with compact summary metrics and responsive revision rows.

## 0.9.0-beta.16 — 2026-08-02

- Fixed storefront uploader token recovery and added specific upload validation messages.
- Hardened the file remove control against theme button styles.
- Redesigned version history as a modern revision timeline with summary metrics.
- Rebuilt assignments with searchable multi-select products, categories, tags, and variations.
- Added a protected admin REST endpoint for assignment target search and label hydration.

## 0.9.0-beta.15 — 2026-08-02

- Rebuilt the private file uploader on both the storefront and builder canvas with a compact upload bar, per-file progress/status rows, size feedback, remove controls, and clear oversized-file errors.
- Added advanced field conditional logic with show/hide behavior, multiple conditions, AND/OR matching, and grouped rule sets.

## 0.9.0-beta.14 — 2026-08-02

- Redesigned inspector tab scrolling with context-aware overlay arrows.
- Scroll arrows now appear only when more tabs exist in that direction.
- Added faded edge masks, smooth tab centering, and cleaner pill styling without an underline.

## 0.9.0-beta.13 — 2026-08-02

- Increased inspector-tab label size and weight for clearer navigation.
- Replaced the narrow tab strip with a polished pill-style scroller.
- Added accessible left/right scroll controls and removed the visible bottom scrollbar/underline.

## 0.9.0-beta.12 — 2026-08-02

- Restored the six-dot grip in Elementor-style palette items with selector-specific styling.
- Reduced vertical spacing between fields in the live builder canvas.
- Reloaded saved WordPress media thumbnails in choice image controls so selected images remain visible after reopening or refreshing the builder.

## 0.9.0-beta.11 — 2026-08-02

- Removed the automatic configurator title and helper copy from the storefront and builder canvas.
- Reworked the builder Elements palette into Elementor-style draggable cards with semantic Dashicons.

## 0.9.0-beta.5 — 2026-08-02

- Fixed add-to-cart being blocked by browser-native validation on conditionally hidden required controls.
- Hidden or conditionally disabled option controls are now disabled before form submission, while server-side validation remains authoritative.
- Made the read-only quote endpoint recover automatically from stale, expired, or full-page-cached public tokens and return a fresh token to the storefront.
- Updated the hidden add-to-cart token after every recovered quote and added cache-busting to token refresh requests.

## 0.9.0-beta.4 — 2026-08-02

- Removed the field wrapper `:focus-within` border-color and box-shadow styles from both LTR and RTL storefront CSS.

## 0.9.0-beta.3 — 2026-08-02

- Removed the storefront configurator's outer background, border, radius, shadow, and padding styles.
- Removed field wrapper background, border, and padding styles from both LTR and RTL storefront CSS.

## 0.9.0-beta.2 — 2026-08-02

- Fixed configured-price quote failures caused by stale public tokens, cached product HTML, and different WooCommerce session initialization timing between page and REST requests.
- Added automatic storefront token refresh and clearer handling for assignment-merge and rate-limit errors.
- Redesigned the builder field palette with larger typography, improved grouping, more legible cards, stronger hover/focus states, and responsive widths.

## 0.9.0-beta.1 — 2026-08-01

- Introduced the Precision Workshop admin shell, sortable field palette/canvas, inspector, Style Studio, assignments, revision history, templates, settings, diagnostics, and analytics views.
- Added immutable option-set drafts and published revisions with content hashes, optimistic concurrency, rollback-by-copy, archive/restore, duplication, search, sorting, and bulk archive.
- Added a registry of 34 field/content types, including choices, text/contact fields, numeric and temporal fields, customer-defined price, private file upload, calculated fields, and true repeaters.
- Added nested rule evaluation and trace, dependency-cycle detection, a bounded formula AST, fixed-scale decimal arithmetic, minor-unit money, and ordered server price breakdowns.
- Added deterministic global/product/variation/category/tag/product-type assignment resolution and compatible-set merging.
- Added accessible storefront rendering, live server quotes, classic cart/order snapshots, linked-product child lines, quantity/removal synchronization, Store API extension data, and a dynamic product-options block.
- Added private upload intents, detected MIME/image checks, scanner adapter, opaque references, retention cleanup, and authorized order downloads.
- Added private/session saved configurations, random hashed expiring share tokens, revalidation on load, and privacy-safe daily analytics.
- Added ten original JSON templates, semantic storefront palettes, typography controls, contrast validation, Site Health integration, and retain-by-default uninstall behavior.
- Added strict TypeScript, JavaScript/CSS linting, production asset compilation, PHP 8.3 syntax execution, and framework-free domain smoke coverage.
