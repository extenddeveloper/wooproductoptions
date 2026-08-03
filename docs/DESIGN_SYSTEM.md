# Precision Workshop design system

WooOptionsFic uses quiet cloud/graphite work surfaces, Iris for primary action,
teal for live preview state, amber for price contribution, and rose for errors.
Semantic CSS custom properties are the only source of product colors, spacing,
radii, and elevation.

The Context Rail on a field card communicates logic, preview, pricing, and
error facts. Icons and text expose the same meaning; color is supplementary.

Admin styles are rooted at `#wooptionsfic-admin-root`. Storefront styles are
rooted at `.wooptionsfic-root`. Storefront palette tokens never recolor
wp-admin. Controls maintain visible labels, 44-pixel touch targets, strong focus
rings, non-color state indicators, and reduced-motion behavior.

The canonical token and preset files live in `design-system/wooptionsfic/`.
