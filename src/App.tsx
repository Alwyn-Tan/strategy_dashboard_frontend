import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Layout,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd'
import dayjs from 'dayjs'

import { fetchCodes, fetchSignals, fetchStockData } from './api/endpoints'
import type { SignalsQueryParams, StockDataQueryParams, StockMeta } from './api/types'
import PriceChart from './components/PriceChart'
import PerformanceChart from './components/PerformanceChart'
import SignalsTable from './components/SignalsTable'
import StatusCards from './components/StatusCards'

const { RangePicker } = DatePicker

const DEFAULTS = {
  code: 'AAPL',
  short_window: 5,
  long_window: 20,
  gen_confirm_bars: 0,
  gen_min_cross_gap: 0,
  filter_signal_type: 'all',

  use_ensemble: false,
  ensemble_pairs: '5:20,10:50,20:100,50:200',
  ensemble_ma_type: 'sma',

  use_regime_filter: false,
  regime_ma_window: 200,
  use_adx_filter: false,
  adx_window: 14,
  adx_threshold: 20,

  use_vol_targeting: false,
  target_vol_annual: 0.15,
  trading_days_per_year: 252,
  vol_window: 14,
  max_leverage: 1,
  min_vol_floor: 1e-6,

  use_chandelier_stop: false,
  chandelier_k: 3,
  use_vol_stop: false,
  vol_stop_atr_mult: 2,
} as const

type DashboardSubmitted = SignalsQueryParams & {
  use_ensemble?: boolean
  ensemble_pairs?: string
  ensemble_ma_type?: 'sma' | 'ema'

  use_regime_filter?: boolean
  regime_ma_window?: number
  use_adx_filter?: boolean
  adx_window?: number
  adx_threshold?: number

  use_vol_targeting?: boolean
  target_vol_annual?: number
  trading_days_per_year?: number
  vol_window?: number
  max_leverage?: number
  min_vol_floor?: number

  use_chandelier_stop?: boolean
  chandelier_k?: number
  use_vol_stop?: boolean
  vol_stop_atr_mult?: number
}

type DashboardFormValues = {
  code: string
  date_range: [dayjs.Dayjs, dayjs.Dayjs] | null
  short_window: number
  long_window: number

  gen_confirm_bars: number
  gen_min_cross_gap: number

  filter_signal_type: 'all' | 'BUY' | 'SELL'

  use_ensemble: boolean
  ensemble_pairs: string
  ensemble_ma_type: 'sma' | 'ema'

  use_regime_filter: boolean
  regime_ma_window: number
  use_adx_filter: boolean
  adx_window: number
  adx_threshold: number

  use_vol_targeting: boolean
  target_vol_annual: number
  trading_days_per_year: number
  vol_window: number
  max_leverage: number
  min_vol_floor: number

  use_chandelier_stop: boolean
  chandelier_k: number
  use_vol_stop: boolean
  vol_stop_atr_mult: number
}

function normalizeEnsemblePairs(value: string): string {
  const raw = (value || '').trim()
  if (!raw) {
    throw new Error('Please provide ensemble_pairs, e.g. 5:20,10:50,20:100,50:200')
  }
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  if (!parts.length) {
    throw new Error('Please provide ensemble_pairs, e.g. 5:20,10:50,20:100,50:200')
  }

  const normalized: string[] = []
  for (const token of parts) {
    const match = token.match(/^(\d+)\s*:\s*(\d+)$/)
    if (!match) {
      throw new Error('Invalid ensemble_pairs format. Example: 5:20,10:50,20:100,50:200')
    }
    const shortW = Number(match[1])
    const longW = Number(match[2])
    if (!Number.isFinite(shortW) || !Number.isFinite(longW) || shortW < 1 || longW < 1) {
      throw new Error('ensemble_pairs windows must be positive integers')
    }
    if (shortW >= longW) {
      throw new Error('ensemble_pairs requires short < long for each pair')
    }
    normalized.push(`${shortW}:${longW}`)
  }

  return normalized.join(',')
}

function getStrategyAssumptions(meta?: StockMeta): unknown | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  const assumptions = (meta as Record<string, unknown>).assumptions
  if (!assumptions || typeof assumptions !== 'object') return undefined
  return (assumptions as Record<string, unknown>).strategy
}

function toSignalsParams(submitted: DashboardSubmitted): SignalsQueryParams {
  return {
    code: submitted.code,
    start_date: submitted.start_date,
    end_date: submitted.end_date,
    short_window: submitted.short_window,
    long_window: submitted.long_window,
    gen_confirm_bars: submitted.gen_confirm_bars,
    gen_min_cross_gap: submitted.gen_min_cross_gap,
    filter_signal_type: submitted.filter_signal_type,
    filter_sort: submitted.filter_sort ?? 'desc',
    filter_limit: submitted.filter_limit,
  }
}

function toStockDataParams(submitted: DashboardSubmitted, { includePerformance }: { includePerformance: boolean }): StockDataQueryParams {
  const params: StockDataQueryParams = {
    code: submitted.code,
    start_date: submitted.start_date,
    end_date: submitted.end_date,
    short_window: submitted.short_window,
    long_window: submitted.long_window,
    gen_confirm_bars: submitted.gen_confirm_bars,
    gen_min_cross_gap: submitted.gen_min_cross_gap,
    include_performance: includePerformance,
  }

  if (!includePerformance) {
    return params
  }

  if (submitted.use_ensemble) {
    params.use_ensemble = true
    params.ensemble_pairs = submitted.ensemble_pairs
    params.ensemble_ma_type = submitted.ensemble_ma_type
  }

  if (submitted.use_regime_filter) {
    params.use_regime_filter = true
    params.regime_ma_window = submitted.regime_ma_window

    if (submitted.use_adx_filter) {
      params.use_adx_filter = true
      params.adx_window = submitted.adx_window
      params.adx_threshold = submitted.adx_threshold
    }
  }

  if (submitted.use_vol_targeting) {
    params.use_vol_targeting = true
    params.target_vol_annual = submitted.target_vol_annual
    params.trading_days_per_year = submitted.trading_days_per_year
    params.vol_window = submitted.vol_window
    params.max_leverage = submitted.max_leverage
    params.min_vol_floor = submitted.min_vol_floor
  }

  if (submitted.use_chandelier_stop) {
    params.use_chandelier_stop = true
    params.chandelier_k = submitted.chandelier_k
  }

  if (submitted.use_vol_stop) {
    params.use_vol_stop = true
    params.vol_stop_atr_mult = submitted.vol_stop_atr_mult
  }

  return params
}

function App() {
  const [form] = Form.useForm<DashboardFormValues>()

  const [submitted, setSubmitted] = useState<DashboardSubmitted>({
    code: DEFAULTS.code,
    short_window: DEFAULTS.short_window,
    long_window: DEFAULTS.long_window,
    gen_confirm_bars: DEFAULTS.gen_confirm_bars,
    gen_min_cross_gap: DEFAULTS.gen_min_cross_gap,
    filter_signal_type: DEFAULTS.filter_signal_type,
    filter_sort: 'desc',

    use_ensemble: DEFAULTS.use_ensemble,
    ensemble_pairs: DEFAULTS.ensemble_pairs,
    ensemble_ma_type: DEFAULTS.ensemble_ma_type,

    use_regime_filter: DEFAULTS.use_regime_filter,
    regime_ma_window: DEFAULTS.regime_ma_window,
    use_adx_filter: DEFAULTS.use_adx_filter,
    adx_window: DEFAULTS.adx_window,
    adx_threshold: DEFAULTS.adx_threshold,

    use_vol_targeting: DEFAULTS.use_vol_targeting,
    target_vol_annual: DEFAULTS.target_vol_annual,
    trading_days_per_year: DEFAULTS.trading_days_per_year,
    vol_window: DEFAULTS.vol_window,
    max_leverage: DEFAULTS.max_leverage,
    min_vol_floor: DEFAULTS.min_vol_floor,

    use_chandelier_stop: DEFAULTS.use_chandelier_stop,
    chandelier_k: DEFAULTS.chandelier_k,
    use_vol_stop: DEFAULTS.use_vol_stop,
    vol_stop_atr_mult: DEFAULTS.vol_stop_atr_mult,
  })

  const [focusDate, setFocusDate] = useState<string | undefined>(undefined)
  const [showBenchmark, setShowBenchmark] = useState(false)

  const useEnsemble = Form.useWatch('use_ensemble', form) ?? DEFAULTS.use_ensemble
  const useRegime = Form.useWatch('use_regime_filter', form) ?? DEFAULTS.use_regime_filter
  const useAdx = Form.useWatch('use_adx_filter', form) ?? DEFAULTS.use_adx_filter
  const useVolTargeting = Form.useWatch('use_vol_targeting', form) ?? DEFAULTS.use_vol_targeting
  const useChandelier = Form.useWatch('use_chandelier_stop', form) ?? DEFAULTS.use_chandelier_stop
  const useVolStop = Form.useWatch('use_vol_stop', form) ?? DEFAULTS.use_vol_stop

  const anyFeatureEnabled = !!(useEnsemble || useRegime || useAdx || useVolTargeting || useChandelier || useVolStop)

  useEffect(() => {
    if (anyFeatureEnabled && !showBenchmark) {
      setShowBenchmark(true)
    }
  }, [anyFeatureEnabled, showBenchmark])

  const codesQuery = useQuery({
    queryKey: ['codes'],
    queryFn: fetchCodes,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (codesQuery.data?.length && !form.getFieldValue('code')) {
      const first = codesQuery.data[0].code
      form.setFieldsValue({ code: first })
      setSubmitted((prev) => ({ ...prev, code: first }))
    }
  }, [codesQuery.data, form])

  const includePerformance = !!(showBenchmark || submitted.use_ensemble || submitted.use_regime_filter || submitted.use_vol_targeting || submitted.use_chandelier_stop || submitted.use_vol_stop)


  const stockQuery = useQuery({
    queryKey: ['stock-data', submitted, includePerformance],
    queryFn: () => fetchStockData(toStockDataParams(submitted, { includePerformance })),
  })

  const signalsQuery = useQuery({
    queryKey: ['signals', submitted],
    queryFn: () => fetchSignals(toSignalsParams(submitted)),
  })

  const codesOptions = useMemo(() => {
    if (codesQuery.data?.length) {
      return codesQuery.data.map((c) => ({ label: c.label, value: c.code }))
    }
    return [
      { label: 'AAPL', value: 'AAPL' },
      { label: 'MSFT', value: 'MSFT' },
      { label: 'NVDA', value: 'NVDA' },
      { label: 'SPY', value: 'SPY' },
      { label: 'QQQ', value: 'QQQ' },
    ]
  }, [codesQuery.data])

  const loading = stockQuery.isLoading || signalsQuery.isLoading
  const stockPayload = useMemo(() => {
    if (Array.isArray(stockQuery.data)) {
      return { data: stockQuery.data }
    }
    return stockQuery.data ?? { data: [] }
  }, [stockQuery.data])

  const bars = stockPayload.data ?? []
  const performance = stockPayload.performance
  const signals = signalsQuery.data?.data ?? []
  const signalsMeta = signalsQuery.data?.meta ?? null

  const strategyAssumptions = useMemo(() => getStrategyAssumptions(stockPayload.meta), [stockPayload.meta])

  const errorMessage = stockQuery.error
    ? (stockQuery.error as Error).message
    : signalsQuery.error
      ? (signalsQuery.error as Error).message
      : codesQuery.error
        ? (codesQuery.error as Error).message
        : null

  return (
    <Layout style={{ height: '100%' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#e2e8f0' }}>
          DMA Strategy Dashboard
        </Typography.Title>
        <Space style={{ color: '#94a3b8' }}>
          <span>Backend:</span>
          <span>{import.meta.env.VITE_API_BASE_URL || 'via Vite proxy (/api → 127.0.0.1:8000)'}</span>
        </Space>
      </Layout.Header>

      <Layout>
        <Layout.Sider
          width={340}
          theme="dark"
          style={{ padding: 16, borderRight: '1px solid rgba(148, 163, 184, 0.12)' }}
        >
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Controls
          </Typography.Title>

          <Form<DashboardFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              code: DEFAULTS.code,
              short_window: DEFAULTS.short_window,
              long_window: DEFAULTS.long_window,
              gen_confirm_bars: DEFAULTS.gen_confirm_bars,
              gen_min_cross_gap: DEFAULTS.gen_min_cross_gap,
              filter_signal_type: DEFAULTS.filter_signal_type,

              use_ensemble: DEFAULTS.use_ensemble,
              ensemble_pairs: DEFAULTS.ensemble_pairs,
              ensemble_ma_type: DEFAULTS.ensemble_ma_type,

              use_regime_filter: DEFAULTS.use_regime_filter,
              regime_ma_window: DEFAULTS.regime_ma_window,
              use_adx_filter: DEFAULTS.use_adx_filter,
              adx_window: DEFAULTS.adx_window,
              adx_threshold: DEFAULTS.adx_threshold,

              use_vol_targeting: DEFAULTS.use_vol_targeting,
              target_vol_annual: DEFAULTS.target_vol_annual,
              trading_days_per_year: DEFAULTS.trading_days_per_year,
              vol_window: DEFAULTS.vol_window,
              max_leverage: DEFAULTS.max_leverage,
              min_vol_floor: DEFAULTS.min_vol_floor,

              use_chandelier_stop: DEFAULTS.use_chandelier_stop,
              chandelier_k: DEFAULTS.chandelier_k,
              use_vol_stop: DEFAULTS.use_vol_stop,
              vol_stop_atr_mult: DEFAULTS.vol_stop_atr_mult,

              date_range: null,
            }}
            onFinish={(values) => {
              const range = values.date_range

              const normalizedPairs = values.use_ensemble ? normalizeEnsemblePairs(values.ensemble_pairs) : values.ensemble_pairs
              const useAdxFilter = values.use_regime_filter ? values.use_adx_filter : false

              const params: DashboardSubmitted = {
                code: values.code,
                short_window: values.short_window,
                long_window: values.long_window,
                gen_confirm_bars: values.gen_confirm_bars,
                gen_min_cross_gap: values.gen_min_cross_gap,
                filter_signal_type: values.filter_signal_type,
                filter_sort: 'desc',
                start_date: range ? range[0].format('YYYY-MM-DD') : undefined,
                end_date: range ? range[1].format('YYYY-MM-DD') : undefined,

                use_ensemble: values.use_ensemble,
                ensemble_pairs: normalizedPairs,
                ensemble_ma_type: values.ensemble_ma_type,

                use_regime_filter: values.use_regime_filter,
                regime_ma_window: values.regime_ma_window,
                use_adx_filter: useAdxFilter,
                adx_window: values.adx_window,
                adx_threshold: values.adx_threshold,

                use_vol_targeting: values.use_vol_targeting,
                target_vol_annual: values.target_vol_annual,
                trading_days_per_year: values.trading_days_per_year,
                vol_window: values.vol_window,
                max_leverage: values.max_leverage,
                min_vol_floor: values.min_vol_floor,

                use_chandelier_stop: values.use_chandelier_stop,
                chandelier_k: values.chandelier_k,
                use_vol_stop: values.use_vol_stop,
                vol_stop_atr_mult: values.vol_stop_atr_mult,
              }
              setFocusDate(undefined)
              setSubmitted(params)
            }}
          >
            <Form.Item label="Symbol" name="code" rules={[{ required: true, message: 'Please select a symbol.' }]}>
              <Select
                showSearch
                options={codesOptions}
                loading={codesQuery.isLoading}
                placeholder="Select a symbol"
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item label="Date Range (optional)" name="date_range">
              <RangePicker allowClear style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Benchmark" style={{ marginBottom: 8 }}>
              <Switch checked={showBenchmark} onChange={setShowBenchmark} disabled={anyFeatureEnabled} />
            </Form.Item>

            <Collapse
              defaultActiveKey={[]}
              items={[
                {
                  key: 'modules',
                  label: 'Strategy Modules (Performance)',
                  children: (
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Typography.Text style={{ color: '#94a3b8' }}>
                        These modules affect the performance backtest only (stock-data). Signals list stays DMA-only.
                      </Typography.Text>

                      <Typography.Title level={5} style={{ margin: 0 }}>
                        Ensemble
                      </Typography.Title>
                      <Form.Item label="use_ensemble" name="use_ensemble" valuePropName="checked">
                        <Switch disabled={!showBenchmark && !anyFeatureEnabled} />
                      </Form.Item>

                      <Form.Item shouldUpdate={(prev, next) => prev.use_ensemble !== next.use_ensemble} noStyle>
                        {({ getFieldValue }) =>
                          getFieldValue('use_ensemble') ? (
                            <>
                              <Form.Item
                                label="ensemble_pairs"
                                name="ensemble_pairs"
                                rules={[
                                  ({ getFieldValue: gv }) => ({
                                    validator(_, value) {
                                      if (!gv('use_ensemble')) return Promise.resolve()
                                      try {
                                        normalizeEnsemblePairs(String(value ?? ''))
                                        return Promise.resolve()
                                      } catch (e) {
                                        return Promise.reject(e instanceof Error ? e : new Error('Invalid ensemble_pairs'))
                                      }
                                    },
                                  }),
                                ]}
                              >
                                <Input placeholder={DEFAULTS.ensemble_pairs} />
                              </Form.Item>

                              <Form.Item label="ensemble_ma_type" name="ensemble_ma_type">
                                <Select options={[{ label: 'SMA', value: 'sma' }, { label: 'EMA', value: 'ema' }]} />
                              </Form.Item>
                            </>
                          ) : null
                        }
                      </Form.Item>

                      <Typography.Title level={5} style={{ margin: 0 }}>
                        Regime Filter
                      </Typography.Title>
                      <Form.Item label="use_regime_filter" name="use_regime_filter" valuePropName="checked">
                        <Switch disabled={!showBenchmark && !anyFeatureEnabled} />
                      </Form.Item>

                      <Form.Item shouldUpdate={(prev, next) => prev.use_regime_filter !== next.use_regime_filter} noStyle>
                        {({ getFieldValue }) =>
                          getFieldValue('use_regime_filter') ? (
                            <>
                              <Form.Item label="regime_ma_window" name="regime_ma_window">
                                <InputNumber min={2} max={1000} style={{ width: '100%' }} />
                              </Form.Item>

                              <Form.Item label="use_adx_filter" name="use_adx_filter" valuePropName="checked">
                                <Switch />
                              </Form.Item>

                              <Form.Item shouldUpdate={(prev, next) => prev.use_adx_filter !== next.use_adx_filter} noStyle>
                                {({ getFieldValue: gv }) =>
                                  gv('use_adx_filter') ? (
                                    <>
                                      <Form.Item label="adx_window" name="adx_window">
                                        <InputNumber min={2} max={200} style={{ width: '100%' }} />
                                      </Form.Item>
                                      <Form.Item label="adx_threshold" name="adx_threshold">
                                        <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
                                      </Form.Item>
                                    </>
                                  ) : null
                                }
                              </Form.Item>
                            </>
                          ) : null
                        }
                      </Form.Item>

                      <Typography.Title level={5} style={{ margin: 0 }}>
                        Volatility Targeting
                      </Typography.Title>
                      <Form.Item label="use_vol_targeting" name="use_vol_targeting" valuePropName="checked">
                        <Switch disabled={!showBenchmark && !anyFeatureEnabled} />
                      </Form.Item>

                      <Form.Item shouldUpdate={(prev, next) => prev.use_vol_targeting !== next.use_vol_targeting} noStyle>
                        {({ getFieldValue }) =>
                          getFieldValue('use_vol_targeting') ? (
                            <>
                              <Form.Item label="target_vol_annual" name="target_vol_annual">
                                <InputNumber min={0.0001} max={5} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item label="trading_days_per_year" name="trading_days_per_year">
                                <InputNumber min={1} max={366} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item label="vol_window" name="vol_window">
                                <InputNumber min={2} max={200} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item label="max_leverage" name="max_leverage">
                                <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item label="min_vol_floor" name="min_vol_floor">
                                <InputNumber min={1e-12} max={1} step={1e-6} style={{ width: '100%' }} />
                              </Form.Item>
                            </>
                          ) : null
                        }
                      </Form.Item>

                      <Typography.Title level={5} style={{ margin: 0 }}>
                        Exits
                      </Typography.Title>
                      <Form.Item label="use_chandelier_stop" name="use_chandelier_stop" valuePropName="checked">
                        <Switch disabled={!showBenchmark && !anyFeatureEnabled} />
                      </Form.Item>

                      <Form.Item shouldUpdate={(prev, next) => prev.use_chandelier_stop !== next.use_chandelier_stop} noStyle>
                        {({ getFieldValue }) =>
                          getFieldValue('use_chandelier_stop') ? (
                            <Form.Item label="chandelier_k" name="chandelier_k">
                              <InputNumber min={0.1} max={10} step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>

                      <Form.Item label="use_vol_stop" name="use_vol_stop" valuePropName="checked">
                        <Switch disabled={!showBenchmark && !anyFeatureEnabled} />
                      </Form.Item>

                      <Form.Item shouldUpdate={(prev, next) => prev.use_vol_stop !== next.use_vol_stop} noStyle>
                        {({ getFieldValue }) =>
                          getFieldValue('use_vol_stop') ? (
                            <Form.Item label="vol_stop_atr_mult" name="vol_stop_atr_mult">
                              <InputNumber min={0.1} max={20} step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>
                    </Space>
                  ),
                },
              ]}
            />

            <Form.Item label="Short Window" name="short_window" rules={[{ required: true }]}>
              <InputNumber min={1} max={500} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Long Window"
              name="long_window"
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const short = getFieldValue('short_window')
                    if (short != null && value != null && short >= value) {
                      return Promise.reject(new Error('Long window must be greater than short window.'))
                    }
                    return Promise.resolve()
                  },
                }),
              ]}
            >
              <InputNumber min={1} max={500} style={{ width: '100%' }} />
            </Form.Item>

            <Typography.Title level={5} style={{ marginBottom: 8, marginTop: 8 }}>
              Signal Rules
            </Typography.Title>

            <Form.Item label="Confirm Bars" name="gen_confirm_bars">
              <InputNumber min={0} max={50} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Min Gap (same signal type)" name="gen_min_cross_gap">
              <InputNumber min={0} max={365} style={{ width: '100%' }} />
            </Form.Item>

            <Typography.Title level={5} style={{ marginBottom: 8, marginTop: 8 }}>
              Filters
            </Typography.Title>

            <Form.Item label="Signal Type" name="filter_signal_type">
              <Select
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'BUY', value: 'BUY' },
                  { label: 'SELL', value: 'SELL' },
                ]}
              />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Run
              </Button>
              <Button
                onClick={() => {
                  form.resetFields()
                  setShowBenchmark(false)
                  setSubmitted({
                    code: DEFAULTS.code,
                    short_window: DEFAULTS.short_window,
                    long_window: DEFAULTS.long_window,
                    gen_confirm_bars: DEFAULTS.gen_confirm_bars,
                    gen_min_cross_gap: DEFAULTS.gen_min_cross_gap,
                    filter_signal_type: DEFAULTS.filter_signal_type,
                    filter_sort: 'desc',

                    use_ensemble: DEFAULTS.use_ensemble,
                    ensemble_pairs: DEFAULTS.ensemble_pairs,
                    ensemble_ma_type: DEFAULTS.ensemble_ma_type,

                    use_regime_filter: DEFAULTS.use_regime_filter,
                    regime_ma_window: DEFAULTS.regime_ma_window,
                    use_adx_filter: DEFAULTS.use_adx_filter,
                    adx_window: DEFAULTS.adx_window,
                    adx_threshold: DEFAULTS.adx_threshold,

                    use_vol_targeting: DEFAULTS.use_vol_targeting,
                    target_vol_annual: DEFAULTS.target_vol_annual,
                    trading_days_per_year: DEFAULTS.trading_days_per_year,
                    vol_window: DEFAULTS.vol_window,
                    max_leverage: DEFAULTS.max_leverage,
                    min_vol_floor: DEFAULTS.min_vol_floor,

                    use_chandelier_stop: DEFAULTS.use_chandelier_stop,
                    chandelier_k: DEFAULTS.chandelier_k,
                    use_vol_stop: DEFAULTS.use_vol_stop,
                    vol_stop_atr_mult: DEFAULTS.vol_stop_atr_mult,
                  })
                }}
              >
                Reset
              </Button>
            </Space>
          </Form>
        </Layout.Sider>

        <Layout.Content style={{ padding: 16, overflow: 'auto' }}>
          {errorMessage ? <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 12 }} /> : null}

          <StatusCards
            bars={bars}
            signals={signals}
            shortWindow={submitted.short_window}
            longWindow={submitted.long_window}
            loading={loading}
          />

          <div style={{ marginTop: 12 }}>
            {loading ? (
              <div style={{ height: 520, display: 'grid', placeItems: 'center' }}>
                <Spin />
              </div>
            ) : (
              <PriceChart
                bars={bars}
                signals={signals}
                shortWindow={submitted.short_window}
                longWindow={submitted.long_window}
                focusDate={focusDate}
              />
            )}
          </div>

          {includePerformance && performance && !stockQuery.isLoading ? (
            <div style={{ marginTop: 12 }}>
              <Typography.Title level={5} style={{ margin: '0 0 8px 0' }}>
                Strategy vs Buy &amp; Hold (Normalized)
              </Typography.Title>
              <PerformanceChart strategy={performance.strategy} benchmark={performance.benchmark} />
            </div>
          ) : null}

          {strategyAssumptions ? (
            <div style={{ marginTop: 12 }}>
              <Collapse
                items={[
                  {
                    key: 'assumptions',
                    label: 'Strategy Assumptions (from backend meta)',
                    children: (
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: 320,
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(strategyAssumptions, null, 2)}
                      </pre>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          <div style={{ marginTop: 12 }}>
            <Typography.Title level={5} style={{ margin: '0 0 8px 0' }}>
              Signals{' '}
              {signalsMeta ? (
                <span style={{ color: '#94a3b8' }}>{`(${signalsMeta.returned_count}/${signalsMeta.generated_count})`}</span>
              ) : null}
            </Typography.Title>
            <SignalsTable signals={signals} loading={signalsQuery.isLoading} onSelectDate={setFocusDate} />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

export default App
