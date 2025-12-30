## ADDED Requirements

### Requirement: Strategy mode control
The system SHALL provide a user-facing control to select `strategy_mode` for the stock-data performance query.

#### Scenario: Default is basic mode
- **WHEN** the user opens the dashboard and runs a query without changing advanced settings
- **THEN** the system requests `/api/stock-data/` without `strategy_mode=advanced`

#### Scenario: User enables advanced mode
- **WHEN** the user selects Strategy Mode = `advanced`
- **THEN** the system includes `strategy_mode=advanced` on `/api/stock-data/` requests
- **AND** the system enables performance output (`include_performance=true`)

### Requirement: Advanced parameters panel
The system SHALL display an advanced parameters panel when Strategy Mode is `advanced`.

#### Scenario: Panel hidden in basic mode
- **WHEN** Strategy Mode is `basic`
- **THEN** advanced-only inputs are not shown

#### Scenario: Panel shown in advanced mode
- **WHEN** Strategy Mode is `advanced`
- **THEN** the panel shows inputs for ensemble/regime/vol targeting/exits

### Requirement: Ensemble pairs validation
The system SHALL validate `ensemble_pairs` before submitting an advanced-mode query.

#### Scenario: Ensemble pairs required
- **WHEN** Strategy Mode is `advanced` and `ensemble_pairs` is empty
- **THEN** the system prevents submission and prompts the user to provide a value

#### Scenario: Ensemble pairs format invalid
- **WHEN** Strategy Mode is `advanced` and `ensemble_pairs` is not in `short:long,...` format
- **THEN** the system prevents submission and shows an example value

### Requirement: Advanced mode request mapping
The system SHALL map advanced UI parameters to backend query parameters for `/api/stock-data/`.

#### Scenario: Advanced-only params not sent in basic mode
- **WHEN** Strategy Mode is `basic`
- **THEN** the system does not send advanced-only params (e.g., `ensemble_pairs`, `target_vol`)

### Requirement: Display reproducibility assumptions
When the backend returns `meta.assumptions.strategy`, the system SHALL display the data in the UI.

#### Scenario: Show assumptions in advanced mode
- **WHEN** the response contains `meta.assumptions.strategy`
- **THEN** the UI renders it in a readable, collapsible section
