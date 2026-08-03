# Source status

This repository replaces the earlier reconstructed administration bundle with real, maintainable TSX source.

`resources/admin/` is the source of truth for the React builder. It contains named components, strict domain models, a WordPress data store, API services, and separated screens. The TypeScript compiler produces `build/admin.js` and a source map.

The storefront remains intentionally lightweight and does not load React. Its browser source is maintained in `resources/storefront/index.js`; PHP remains authoritative for configuration, pricing, validation, uploads, cart data, and published revisions.
