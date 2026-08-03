# Release QA evidence — 0.9.0-beta.1

Date: 2026-08-01

## Completed in this build environment

| Check | Result |
|---|---|
| TypeScript strict (`tsc --noEmit`) | Passed |
| WordPress JavaScript lint | Passed |
| WordPress Stylelint | Passed |
| Production webpack build | Passed; admin size advisory only |
| PHP 8.3 engine syntax parse | Passed for all 80 PHP files |
| Independent PHP AST parse | Passed |
| PHP domain smoke suite | Passed, 48 assertions |
| Template compiler fixtures | Passed, 10 of 10 |
| Release archive path/secret/source-map inspection | Passed |

Pressship discovery succeeded and found the correct plugin entry point. Its
browser-backed validation could not start because this restricted build host
could not install Playwright Chromium. Validation was not bypassed; the archive
received the independent checks listed above instead.

The domain suite covers decimal/money rounding, division-by-zero behavior, formula parsing/evaluation/aggregates, rule nesting/trace/regex policy, UUIDs, canonical hashes, unknown references, dependency cycles, hidden stale values, repeaters, price overrides, quantity extension, formula unit prices, repeater pricing, and secret-value snapshot redaction.

## Not available in this build environment

- A native WordPress/WooCommerce database/runtime was not present, so clean-site activation, `dbDelta`, WooCommerce hooks, HPOS, Cart/Checkout Blocks, email, refund, reorder, and browser end-to-end tests could not be honestly marked as passed.
- Composer/PHPCS/PHPStan were not preinstalled. PHP was instead executed through an isolated PHP 8.3 WebAssembly runtime and independently parsed.
- Automated axe and multi-browser visual regression were not available.

These are staging gates, not silent claims. See `KNOWN_LIMITATIONS.md` before production use.
