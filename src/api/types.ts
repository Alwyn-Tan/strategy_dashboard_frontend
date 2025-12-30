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

export type StrategyMode = 'basic' | 'advanced'
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

  strategy_mode?: StrategyMode

  // Advanced strategy parameters (only meaningful when strategy_mode=advanced)
  regime_ma_window?: number
  use_adx_filter?: boolean
  adx_window?: number
  adx_threshold?: number

  ensemble_pairs?: string
  ensemble_ma_type?: MovingAverageType

  target_vol?: number
  vol_window?: number
  max_leverage?: number
  min_vol_floor?: number

  use_chandelier_stop?: boolean
  chandelier_k?: number
  use_vol_stop?: boolean
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
