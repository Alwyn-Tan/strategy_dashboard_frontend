## 1. Implementation
- [x] Update API query param types to include feature toggles and annualized vol targeting fields
- [x] Remove Strategy Mode selector from `src/App.tsx`
- [x] Add feature toggles and conditional parameter panels
- [x] Update stock-data request mapping to send toggles/params and stop sending `strategy_mode`
- [x] Ensure signals request remains DMA-only (do not send module params)
- [x] Update assumptions UI to reference `features_enabled` (if present)

## 2. Validation
- [x] `npm run lint`
- [x] `npm run build`

## 3. Documentation
- [x] Update `README.md` with the new toggles-based workflow
