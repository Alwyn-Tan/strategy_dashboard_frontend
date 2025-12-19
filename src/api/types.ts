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

export type StockQueryParams = {
  code: string
  start_date?: string
  end_date?: string
  short_window: number
  long_window: number
  include_performance?: boolean
}

export type StockDataResponse =
  | StockBar[]
  | {
      data: StockBar[]
      meta?: StockMeta
      performance?: PerformanceSeries
    }

export type SignalsQueryParams = StockQueryParams & {
  gen_confirm_bars?: number
  gen_min_cross_gap?: number
  filter_signal_type?: 'all' | 'BUY' | 'SELL'
  filter_limit?: number
  filter_sort?: 'asc' | 'desc'
}
