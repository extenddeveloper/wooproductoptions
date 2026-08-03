# Developer extension hooks

WooOptionsFic deliberately exposes a small set of high-value hooks. Callbacks must return the documented shape, validate untrusted data, avoid personal data in logs, and remain deterministic during add-to-cart and checkout.

## Register a field type

```php
add_action(
    'wooptionsfic_register_field_types',
    static function (WooOptionsFic\Domain\Definition\FieldTypeRegistry $registry): void {
        $registry->register(new My_Field_Type());
    }
);
```

An implementation must satisfy `WooOptionsFic\Domain\Definition\FieldType`: stable key, definition normalization, customer-value normalization, server validation, safe formatting, and whether it accepts customer input. It must also provide its admin/editor and storefront integration if it is customer-facing.

## Upload scanner result

```php
add_filter(
    'wooptionsfic_upload_scan_result',
    static function (array $result, string $temporary_path, string $mime, string $extension, array $record): array {
        // Send only the temporary file to an approved scanner.
        // Never return a public path or URL.
        return ['accepted' => true, 'code' => 'vendor_clean'];
    },
    10,
    5
);
```

Return `accepted` as a boolean and a bounded machine-readable `code`. A false/malformed response keeps the file rejected.

## Definition and price contracts

The public REST namespace is `wooptionsfic/v1`. Admin routes require the matching fine-grained capability and WordPress REST nonce. Customer routes use product/revision-bound short-lived tokens plus user/session ownership and rate limits. Client quote responses are previews only; the cart integration recalculates them.

Compiled definitions and snapshot values use stable UUIDs. Money uses integer minor units and includes a decimal string, ISO currency, and currency scale. Avoid floats when integrating with pricing.

## Private storage override

Define `WOOPTIONSFIC_PRIVATE_DIR` before plugins load to select an absolute, non-public directory. The web server process must be able to create and read it. Do not point it at the WordPress root, content root, Media Library, or a shared unrelated directory.

## Uninstall removal override

Data is retained by default. A deployment-controlled removal can be explicitly enabled before uninstall:

```php
define('WOOPTIONSFIC_REMOVE_DATA', true);
```

The uninstaller deletes only plugin tables and exact 64-character private storage objects associated with that site.
