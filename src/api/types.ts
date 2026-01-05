export type CodeItem = {
  code: string
  label: string
  file: string
}

export type StockBar = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma_short: number | null
  ma_long: number | null
}

export type PerformancePoint = {
  date: string
  value: number
}

export type PerformanceSeries = {
  strategy: PerformancePoint[]
  benchmark: PerformancePoint[]
}

export type StockMeta = {
  [key: string]: unknown
}

export type Signal = {
  date: string
  signal_type: 'BUY' | 'SELL'
  price: number
  ma_short: number
  ma_long: number
}

export type SignalsResponse = {
  data: Signal[]
  meta: {
    generated_count: number
    returned_count: number
    params: Record<string, unknown>
  }
}

export type MovingAverageType = 'sma' | 'ema'

export type CommonQueryParams = {
  code: string
  start_date?: string
  end_date?: string
  short_window: number
  long_window: number
  gen_confirm_bars?: number
  gen_min_cross_gap?: number
}

export type StockDataQueryParams = CommonQueryParams & {
  include_performance?: boolean

  // Strategy feature toggles (performance only)
  use_ensemble?: boolean
  use_regime_filter?: boolean
  use_adx_filter?: boolean
  use_vol_targeting?: boolean
  use_chandelier_stop?: boolean
  use_vol_stop?: boolean

  // Module parameters (sent only when enabled)
  ensemble_pairs?: string
  ensemble_ma_type?: MovingAverageType

  regime_ma_window?: number
  adx_window?: number
  adx_threshold?: number

  target_vol_annual?: number
  trading_days_per_year?: number
  vol_window?: number
  max_leverage?: number
  min_vol_floor?: number

  chandelier_k?: number
  vol_stop_atr_mult?: number
}

export type StockDataResponse =
  | StockBar[]
  | {
      data: StockBar[]
      meta?: StockMeta
      performance?: PerformanceSeries
    }

export type SignalsQueryParams = CommonQueryParams & {
  filter_signal_type?: 'all' | 'BUY' | 'SELL'
  filter_limit?: number
  filter_sort?: 'asc' | 'desc'
}
