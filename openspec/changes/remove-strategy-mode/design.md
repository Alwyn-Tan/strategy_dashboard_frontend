# Design: Feature toggles in dashboard controls

## Default behavior
- With all toggles OFF, the dashboard behaves as today: pure DMA controlled by `short_window` and `long_window`.

## Feature toggles
Each module has an explicit toggle. If the toggle is OFF, its parameters are not sent.

### Ensemble
- Toggle: `use_ensemble`
- Params (when enabled):
  - `ensemble_pairs` (string like `5:20,10:50,20:100,50:200`)
  - `ensemble_ma_type` (`sma`/`ema`)
- Client-side validation: require `ensemble_pairs` and validate `short < long` per pair.

### Regime filter
- Toggle: `use_regime_filter`
- Params: `regime_ma_window`
- Optional ADX gate:
  - Toggle: `use_adx_filter`
  - Params: `adx_window`, `adx_threshold`
  - UI rule: ADX toggle is disabled unless regime filter is enabled.

### Volatility targeting
- Toggle: `use_vol_targeting`
- Params:
  - `target_vol_annual` (decimal, e.g. 0.15)
  - `trading_days_per_year` (default 252)
  - `vol_window`, `max_leverage`, `min_vol_floor`

### Exits
- Toggles: `use_chandelier_stop`, `use_vol_stop`
- Params shown only when enabled:
  - `chandelier_k`, `vol_stop_atr_mult`

## Request mapping
- `/api/stock-data/` request:
  - Always includes base DMA params.
  - Includes `include_performance=true` when Benchmark is enabled.
  - Includes toggles and enabled-module params.
  - Does NOT include `strategy_mode`.
- `/api/signals/` request:
  - Remains DMA-only and does not send advanced-module params.

## Reproducibility
- When backend returns `meta.assumptions.strategy.features_enabled`, show it in the UI (existing “assumptions” section can remain).
