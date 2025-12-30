# Design: Advanced strategy mode controls (frontend)

## Overview
The dashboard currently has a single Benchmark switch that toggles `include_performance=true`. Advanced mode is an extension of that same flow:
- Advanced mode is only meaningful when performance is requested.
- Advanced mode adds additional query parameters to `/api/stock-data/`.

## UI Model
### Strategy Mode
- `basic` (default): current behavior
- `advanced`: enable additional controls and send `strategy_mode=advanced`

### Relationship to Benchmark switch
- Keep the existing Benchmark switch as the primary “show performance chart” toggle.
- If Strategy Mode is switched to `advanced`, Benchmark MUST be enabled (because advanced mode is implemented only for performance).
  - UX: turning on Advanced auto-enables Benchmark; turning off Benchmark while Advanced is on should either be prevented (disabled) or auto-switch Strategy Mode back to `basic`.

## Advanced Parameter Panel
Shown only when Strategy Mode is `advanced`.

### Ensemble (required)
- Input: `ensemble_pairs` (string)
- Default: `5:20,10:50,20:100,50:200`
- Validation: must be a comma-separated list of `short:long` pairs with integers and `short < long`.
- Optional: `ensemble_ma_type` (`sma`/`ema`)

### Regime
- `regime_ma_window` (default 200)
- `use_adx_filter` (default false)
  - If enabled: `adx_window` (default 14), `adx_threshold` (default 20)

### Volatility Targeting
- `target_vol` (default 0.02)
- `vol_window` (default 14)
- `max_leverage` (default 1.0)
- `min_vol_floor` (default 1e-6) (optional advanced field; can be hidden behind “more”)

### Exits (optional)
- `use_chandelier_stop` + `chandelier_k` (default 3.0)
- `use_vol_stop` + `vol_stop_atr_mult` (default 2.0)

## Request Mapping
- Always send `include_performance=true` when Benchmark is enabled.
- If Strategy Mode is `advanced`:
  - send `strategy_mode=advanced`
  - send advanced parameters (at least `ensemble_pairs`)
- If Strategy Mode is `basic`:
  - do not send `strategy_mode` (or send `basic`), but MUST NOT send advanced-only params.

## Reproducibility Surface
When backend response includes `meta.assumptions.strategy`, display it as JSON in a collapsible section (e.g., AntD `Collapse` + `Typography.Text` / `pre`).
