# ADR-0004: Private local upload storage

Status: Accepted for beta  
Date: 2026-07-30

## Decision

Default to a non-Media-Library vault at
`WP_CONTENT_DIR/wooptionsfic-private`, overridable with the
`WOOPTIONSFIC_PRIVATE_DIR` constant. Files receive unpredictable extensionless
storage keys and denial files are created for Apache/IIS. Direct URLs are never
returned.

Upload intents bind an opaque reference to a WooCommerce/customer session,
product, field, revision, size/type policy, and expiry. A scanner interface is
provided. The bundled baseline scanner performs MIME, signature, extension,
size, and executable-type checks; sites needing antivirus must attach a scanner
through the documented filter before claiming scanned status.
