# ADR-0002: WordPress-native React and TypeScript

Status: Accepted  
Date: 2026-07-30

## Decision

Use React function components written in strict TypeScript, the
WordPress-managed element runtime and controls, a plugin-owned
`@wordpress/data` store, and `@dnd-kit/react` behind a reorder adapter.
WordPress dependency extraction prevents a second React runtime.

The storefront remains server-rendered and uses a small independent TypeScript
controller. Domain document transforms, command history, rules, and formula
preview remain framework-neutral.
