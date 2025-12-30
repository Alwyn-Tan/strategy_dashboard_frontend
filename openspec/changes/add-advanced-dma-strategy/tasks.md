## 1. Implementation
- [x] Extend API query param types (`src/api/types.ts`) to support advanced-mode fields
- [x] Add Strategy Mode control to `src/App.tsx` and wire it into the stock-data query
- [x] Add Advanced Parameters panel shown only in advanced mode
- [x] Implement client-side validation for `ensemble_pairs` (block submit with helpful error)
- [x] Ensure advanced mode forces Benchmark/performance on (prevent invalid combinations)
- [x] Display `meta.assumptions.strategy` when present

## 2. Validation
- [x] `npm run lint`
- [x] `npm run build` (TypeScript typecheck)

## 3. Documentation
- [x] Update frontend `README.md` with a brief advanced-mode usage example
