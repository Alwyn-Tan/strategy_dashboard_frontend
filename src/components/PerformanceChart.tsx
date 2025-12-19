import { useEffect, useMemo, useRef } from 'react'
import { createChart, LineSeries, LineStyle, type IChartApi, type Time } from 'lightweight-charts'

import type { PerformancePoint } from '../api/types'

type Props = {
  strategy: PerformancePoint[]
  benchmark: PerformancePoint[]
}

export default function PerformanceChart({ strategy, benchmark }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<{
    strategy: ReturnType<IChartApi['addSeries']> | null
    benchmark: ReturnType<IChartApi['addSeries']> | null
  }>({ strategy: null, benchmark: null })

  const strategyData = useMemo(
    () => strategy.map((p) => ({ time: p.date as Time, value: p.value })),
    [strategy]
  )
  const benchmarkData = useMemo(
    () => benchmark.map((p) => ({ time: p.date as Time, value: p.value })),
    [benchmark]
  )

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#0b1220' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.08)', style: LineStyle.Solid },
        horzLines: { color: 'rgba(148, 163, 184, 0.08)', style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.25)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.25)',
      },
    })

    const strategySeries = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
      title: 'Strategy (Normalized)',
    })

    const benchmarkSeries = chart.addSeries(LineSeries, {
      color: '#94a3b8',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      title: 'Buy & Hold',
    })

    chartRef.current = chart
    seriesRef.current = { strategy: strategySeries, benchmark: benchmarkSeries }

    const ro = new ResizeObserver(() => {
      chart.applyOptions({})
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = { strategy: null, benchmark: null }
    }
  }, [])

  useEffect(() => {
    const { strategy: strategySeries, benchmark: benchmarkSeries } = seriesRef.current
    if (!strategySeries || !benchmarkSeries) return
    strategySeries.setData(strategyData)
    benchmarkSeries.setData(benchmarkData)
    chartRef.current?.timeScale().fitContent()
  }, [strategyData, benchmarkData])

  return <div ref={containerRef} style={{ height: 320, width: '100%' }} />
}
