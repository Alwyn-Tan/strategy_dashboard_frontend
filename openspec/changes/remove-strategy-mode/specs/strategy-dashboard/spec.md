## MODIFIED Requirements

### Requirement: Strategy configuration controls
The system SHALL allow users to configure the strategy via explicit feature toggles rather than a `basic/advanced` mode switch.

#### Scenario: Default is pure DMA
- **WHEN** the user runs the dashboard without enabling any feature toggles
- **THEN** the system requests `/api/stock-data/` with only the base DMA parameters

#### Scenario: Enable a module via toggle
- **WHEN** the user enables `use_regime_filter`
- **THEN** the system includes `use_regime_filter=true` and the related parameters on `/api/stock-data/` requests

## REMOVED Requirements

### Requirement: Strategy Mode selector
The system previously exposed a Strategy Mode selector that mapped to `strategy_mode=advanced`.

#### Scenario: Strategy Mode removed
- **WHEN** the user configures strategy behavior
- **THEN** the UI does not require a mode selector

## ADDED Requirements

### Requirement: Conditional parameter inputs
The system SHALL show parameter inputs only when their corresponding feature toggle is enabled.

#### Scenario: Hidden parameters when disabled
- **WHEN** `use_vol_targeting` is disabled
- **THEN** the UI hides `target_vol_annual` and related volatility-targeting fields

### Requirement: Request mapping does not send strategy_mode
The system SHALL NOT send a `strategy_mode` query parameter to `/api/stock-data/`.

#### Scenario: No strategy_mode in requests
- **WHEN** the user runs the dashboard
- **THEN** the `/api/stock-data/` request does not contain `strategy_mode`
