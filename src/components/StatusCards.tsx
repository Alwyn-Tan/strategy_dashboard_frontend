import { Card, Col, Row, Statistic, Tag } from 'antd'

import type { Signal, StockBar } from '../api/types'

function lastNonNull<T>(items: T[], getter: (item: T) => number | null | undefined): number | null {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const v = getter(items[i])
    if (v != null && Number.isFinite(v)) return v
  }
  return null
}

type Props = {
  bars: StockBar[]
  signals: Signal[]
  shortWindow: number
  longWindow: number
  loading?: boolean
}

export default function StatusCards({ bars, signals, shortWindow, longWindow, loading }: Props) {
  const latest = bars.at(-1)
  const latestClose = latest?.close ?? null
  const maShort = lastNonNull(bars, (b) => b.ma_short)
  const maLong = lastNonNull(bars, (b) => b.ma_long)
  const spread = maShort != null && maLong != null ? maShort - maLong : null

  const lastSignal = signals[0] ?? null

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic title="Latest Close" value={latestClose ?? undefined} precision={2} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic title={`MA(${shortWindow})`} value={maShort ?? undefined} precision={2} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic title={`MA(${longWindow})`} value={maLong ?? undefined} precision={2} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Last Signal"
            value={lastSignal ? `${lastSignal.signal_type} @ ${lastSignal.date}` : '—'}
            valueStyle={{ fontSize: 14 }}
            prefix={
              lastSignal ? <Tag color={lastSignal.signal_type === 'BUY' ? 'green' : 'red'}>{lastSignal.signal_type}</Tag> : undefined
            }
            suffix={spread != null ? <span style={{ marginLeft: 8, color: '#94a3b8' }}>{`Spread ${spread.toFixed(2)}`}</span> : undefined}
          />
        </Card>
      </Col>
    </Row>
  )
}
