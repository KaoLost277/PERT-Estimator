---
name: Project Standard
description: Mandatory standards for PERT Estimator project
---

# Project Standard Skill

This skill defines the mandatory coding and design standards for the PERT Estimator project. Every AI assistant MUST read and follow these rules.

## Core Mandates

### 1. The "Zero Any" Rule
- `any` is strictly prohibited.
- Use explicit interfaces for all data structures.
- Casting should only be used as a last resort and must be explained.

### 2. Math & Logic Centralization
- Mathematical formulas (PERT TE, SD, Critical Path) MUST be located in `f:/pert/lib/calculations.ts` or `f:/pert/lib/logic.ts`.
- Components should only call these functions, never implement their own math.

### 3. Visual Identity
- Follow the "Premium Design" guidelines:
    - Use HSL-based colors for consistency.
    - Implement subtle shadows (`premium-shadow`) and rounded corners (`rounded-2xl`, `rounded-3xl`).
    - Use the `cn` utility for all conditional styling.

### 4. Internationalization (i18n)
- Never hardcode strings in UI components.
- Use the `language` state from `useProjects()` and the `translations` object from `@/lib/i18n`.

## Implementation Workflow
1. **Analyze**: Check existing types and logic in `lib/`.
2. **Standardize**: Apply the `cn` utility and premium CSS classes.
3. **Verify**: Run `npm run lint` and `npm run build` after every major change.
4. **Document**: Add JSDoc to every new function.
