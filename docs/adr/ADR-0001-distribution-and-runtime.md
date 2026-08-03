# ADR-0001: Distribution and runtime baseline

Status: Accepted for beta  
Date: 2026-07-30

## Decision

Build a private, installable beta ZIP first. WordPress.org publication remains
a separate review because the final commercial name, support channel, assets,
and directory slug require product-owner confirmation.

The beta requires PHP 8.1+, WordPress 6.9+, and WooCommerce 9.0+. Development
targets WordPress 7.0.2 and WooCommerce 10.9.4, the current stable releases
consulted on 30 July 2026. Compatibility is not labelled Certified until the
matrix runs on real WordPress/WooCommerce installations.

## Consequences

The plugin can use strict types and modern PHP while supporting the previous
WooCommerce major line. It does not include licensing, telemetry, remote update
calls, trials, or edition gates.
