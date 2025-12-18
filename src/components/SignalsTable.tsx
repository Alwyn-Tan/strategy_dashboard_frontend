import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { Signal } from '../api/types'

type Props = {
  signals: Signal[]
  loading?: boolean
  onSelectDate?: (date: string) => void
}

export default function SignalsTable({ signals, loading, onSelectDate }: Props) {
  const columns: ColumnsType<Signal> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, sorter: (a, b) => a.date.localeCompare(b.date) },
    {
      title: 'Signal',
      dataIndex: 'signal_type',
      key: 'signal_type',
      width: 100,
      filters: [
        { text: 'BUY', value: 'BUY' },
        { text: 'SELL', value: 'SELL' },
      ],
      onFilter: (value, record) => record.signal_type === value,
      render: (v: Signal['signal_type']) => <Tag color={v === 'BUY' ? 'green' : 'red'}>{v}</Tag>,
    },
    { title: 'Price', dataIndex: 'price', key: 'price', width: 120, render: (v: number) => v.toFixed(2) },
    { title: 'MA(short)', dataIndex: 'ma_short', key: 'ma_short', width: 120, render: (v: number) => v.toFixed(2) },
    { title: 'MA(long)', dataIndex: 'ma_long', key: 'ma_long', width: 120, render: (v: number) => v.toFixed(2) },
  ]

  return (
    <Table
      size="small"
      rowKey={(r) => `${r.date}-${r.signal_type}-${r.price}`}
      loading={loading}
      columns={columns}
      dataSource={signals}
      pagination={{ pageSize: 8, showSizeChanger: false }}
      onRow={(record) => ({
        onClick: () => onSelectDate?.(record.date),
        style: { cursor: onSelectDate ? 'pointer' : 'default' },
      })}
    />
  )
}

