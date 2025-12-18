import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, DatePicker, Form, InputNumber, Layout, Select, Space, Spin, Typography } from 'antd'
import dayjs from 'dayjs'

import { fetchCodes, fetchSignals, fetchStockData } from './api/endpoints'
import type { SignalsQueryParams } from './api/types'
import PriceChart from './components/PriceChart'
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
} as const

function App() {
  const [form] = Form.useForm()
  const [submitted, setSubmitted] = useState<SignalsQueryParams>({
    code: DEFAULTS.code,
    short_window: DEFAULTS.short_window,
    long_window: DEFAULTS.long_window,
    gen_confirm_bars: DEFAULTS.gen_confirm_bars,
    gen_min_cross_gap: DEFAULTS.gen_min_cross_gap,
    filter_signal_type: DEFAULTS.filter_signal_type,
    filter_sort: 'desc',
  })
  const [focusDate, setFocusDate] = useState<string | undefined>(undefined)

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

  const stockQuery = useQuery({
    queryKey: ['stock-data', submitted],
    queryFn: () => fetchStockData(submitted),
  })

  const signalsQuery = useQuery({
    queryKey: ['signals', submitted],
    queryFn: () => fetchSignals(submitted),
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
  const bars = stockQuery.data ?? []
  const signals = signalsQuery.data?.data ?? []
  const signalsMeta = signalsQuery.data?.meta ?? null

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
        <Layout.Sider width={340} theme="dark" style={{ padding: 16, borderRight: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Controls
          </Typography.Title>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              code: DEFAULTS.code,
              short_window: DEFAULTS.short_window,
              long_window: DEFAULTS.long_window,
              gen_confirm_bars: DEFAULTS.gen_confirm_bars,
              gen_min_cross_gap: DEFAULTS.gen_min_cross_gap,
              filter_signal_type: DEFAULTS.filter_signal_type,
              date_range: null,
            }}
            onFinish={(values) => {
              const range = values.date_range as [dayjs.Dayjs, dayjs.Dayjs] | null
              const params: SignalsQueryParams = {
                code: values.code,
                short_window: values.short_window,
                long_window: values.long_window,
                gen_confirm_bars: values.gen_confirm_bars,
                gen_min_cross_gap: values.gen_min_cross_gap,
                filter_signal_type: values.filter_signal_type,
                filter_sort: 'desc',
                start_date: range ? range[0].format('YYYY-MM-DD') : undefined,
                end_date: range ? range[1].format('YYYY-MM-DD') : undefined,
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
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>

            <Form.Item label="Date Range (optional)" name="date_range">
              <RangePicker allowClear style={{ width: '100%' }} />
            </Form.Item>

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
                  setSubmitted({
                    code: DEFAULTS.code,
                    short_window: DEFAULTS.short_window,
                    long_window: DEFAULTS.long_window,
                    gen_confirm_bars: DEFAULTS.gen_confirm_bars,
                    gen_min_cross_gap: DEFAULTS.gen_min_cross_gap,
                    filter_signal_type: DEFAULTS.filter_signal_type,
                    filter_sort: 'desc',
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

          <div style={{ marginTop: 12 }}>
            <Typography.Title level={5} style={{ margin: '0 0 8px 0' }}>
              Signals {signalsMeta ? <span style={{ color: '#94a3b8' }}>{`(${signalsMeta.returned_count}/${signalsMeta.generated_count})`}</span> : null}
            </Typography.Title>
            <SignalsTable signals={signals} loading={signalsQuery.isLoading} onSelectDate={setFocusDate} />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

export default App
