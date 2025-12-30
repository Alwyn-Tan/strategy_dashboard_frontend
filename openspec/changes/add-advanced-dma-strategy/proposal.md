# Change: Add advanced strategy controls (frontend)

## Why
The backend now supports an opt-in `strategy_mode=advanced` for `/api/stock-data/` performance calculations. Without UI support, users must manually edit query strings, which is error-prone and makes the advanced mode hard to discover.

## What Changes
- Add a **Strategy Mode** control to the dashboard to switch between `basic` and `advanced` for backtest/performance.
- When `advanced` is selected, show an **Advanced Parameters** panel (ensemble/regime/vol targeting/exits) and map values to backend query params.
- Keep existing default behavior unchanged (users staying in `basic` keep the same experience).
- Surface `meta.assumptions.strategy` (when present) in a small, collapsible UI section for reproducibility/debugging.

## Cross-Repo Contract
Backend is the lead proposal and canonical API contract:
- `dma-strategy-backend/openspec/changes/add-advanced-dma-strategy/proposal.md`

Frontend implements UI + parameter mapping only; it does not redefine backend semantics.

## Impact
- Affected specs:
  - `strategy-dashboard` (UI controls and request mapping)
- Affected code (expected):
  - `src/App.tsx` (controls UI + query construction)
  - `src/api/types.ts` (query param types)
  - `src/api/endpoints.ts` (no behavior change; typed params)

## Non-Goals
- No new pages/routes.
- No new test framework (repo currently relies on `tsc` + ESLint).
- No change to charts beyond enabling advanced-mode performance queries.
