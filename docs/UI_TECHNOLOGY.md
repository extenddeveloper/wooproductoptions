# UI technology

The administration application uses React with strict TypeScript through
WordPress-managed packages. It mounts only on WooOptionsFic screens.

- Runtime primitives: `@wordpress/element`
- Controls: `@wordpress/components`
- Shared state: namespaced `@wordpress/data` store
- Requests: `@wordpress/api-fetch`
- Drag/sort adapter: `@dnd-kit/react` 0.5 with visible move commands
- Build: `@wordpress/scripts` 34 and dependency extraction

React, ReactDOM, and eligible WordPress packages are externalized. The
storefront is separately built, PHP-rendered first, and progressively enhanced.
No admin React application is mounted on product pages.

The WordPress 7.0 runtime still uses React 18. The code avoids deprecated root
APIs and keeps the DnD dependency compatible with React 18/19 so a future
runtime transition can be tested without changing the document model.
