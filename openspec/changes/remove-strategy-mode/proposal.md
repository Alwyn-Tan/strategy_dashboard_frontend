# Change: Remove Strategy Mode UI and use explicit feature toggles

## Why
The backend is moving away from `strategy_mode=basic|advanced` toward a single DMA baseline with optional modules (regime filter, ensemble, volatility targeting, exits) enabled via explicit toggles.
The current dashboard UI exposes a `Strategy Mode` selector and sends `strategy_mode=advanced`, which will no longer match the backend contract.

## What Changes
- Remove the `Strategy Mode` selector from the dashboard.
- Add explicit feature toggles (checkbox/switch) and show parameter inputs only when a feature is enabled:
  - Ensemble (`use_ensemble`, `ensemble_pairs`, `ensemble_ma_type`)
  - Regime filter (`use_regime_filter`, `regime_ma_window`) and optional ADX (`use_adx_filter`, `adx_window`, `adx_threshold`)
  - Volatility targeting (`use_vol_targeting`, `target_vol_annual`, `trading_days_per_year`, `vol_window`, `max_leverage`, `min_vol_floor`)
  - Exits (`use_chandelier_stop`, `chandelier_k`, `use_vol_stop`, `vol_stop_atr_mult`)
- Update request mapping to stop sending `strategy_mode` and instead send feature toggles + params to `/api/stock-data/`.
- Keep default behavior unchanged for users who do not enable any toggles (pure DMA).

## Cross-Repo Contract
Backend is the canonical contract and lead proposal:
- `dma-strategy-backend/openspec/changes/remove-strategy-mode/proposal.md`

## Impact
- Affected specs:
  - `strategy-dashboard`
- Affected code (expected):
  - `src/App.tsx` (controls UI + request mapping)
  - `src/api/types.ts` (query param types)
  - `README.md`

## Non-Goals
- No new routes/pages.
- No new test framework (repo currently validates via `npm run lint` and `npm run build`).
