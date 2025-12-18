import { useEffect, useMemo, useRef } from 'react'
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesMarkersPluginApi,
  type Time,
} from 'lightweight-charts'

import type { Signal, StockBar } from '../api/types'

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type Props = {
  bars: StockBar[]
  signals: Signal[]
  shortWindow: number
  longWindow: number
  focusDate?: string
}

export default function PriceChart({ bars, signals, shortWindow, longWindow, focusDate }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const seriesRef = useRef<{
    candle: ReturnType<IChartApi['addSeries']> | null
    maShort: ReturnType<IChartApi['addSeries']> | null
    maLong: ReturnType<IChartApi['addSeries']> | null
    volume: ReturnType<IChartApi['addSeries']> | null
  }>({ candle: null, maShort: null, maLong: null, volume: null })

  const candleData = useMemo(() => {
    return bars.map((b) => ({
      time: b.date as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }))
  }, [bars])

  const volumeData = useMemo(() => {
    return bars.map((b) => {
      const up = b.close >= b.open
      return {
        time: b.date as Time,
        value: b.volume,
        color: up ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      }
    })
  }, [bars])

  const maShortData = useMemo(() => {
    return bars
      .filter((b) => b.ma_short != null)
      .map((b) => ({ time: b.date as Time, value: b.ma_short as number }))
  }, [bars])

  const maLongData = useMemo(() => {
    return bars
      .filter((b) => b.ma_long != null)
      .map((b) => ({ time: b.date as Time, value: b.ma_long as number }))
  }, [bars])

  const markers = useMemo(() => {
    return signals.map((s) => {
      const buy = s.signal_type === 'BUY'
      return {
        time: s.date as Time,
        position: buy ? 'belowBar' : 'aboveBar',
        color: buy ? '#22c55e' : '#ef4444',
        shape: buy ? 'arrowUp' : 'arrowDown',
        text: s.signal_type,
      } as const
    })
  }, [signals])

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
      crosshair: {
        mode: CrosshairMode.Magnet,
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.25)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.25)',
      },
    })

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    const maShort = chart.addSeries(LineSeries, {
      color: '#60a5fa',
      lineWidth: 2,
      title: `MA(${shortWindow})`,
    })

    const maLong = chart.addSeries(LineSeries, {
      color: '#fbbf24',
      lineWidth: 2,
      title: `MA(${longWindow})`,
    })

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    })
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    seriesRef.current = { candle, maShort, maLong, volume }
    markersRef.current = createSeriesMarkers(candle, [])

    const ro = new ResizeObserver(() => {
      chart.applyOptions({}) // triggers autoSize layout
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      markersRef.current?.detach()
      markersRef.current = null
      chart.remove()
      chartRef.current = null
      seriesRef.current = { candle: null, maShort: null, maLong: null, volume: null }
    }
  }, [shortWindow, longWindow])

  useEffect(() => {
    const { candle, maShort, maLong, volume } = seriesRef.current
    if (!candle || !maShort || !maLong || !volume) return

    candle.setData(candleData)
    maShort.setData(maShortData)
    maLong.setData(maLongData)
    volume.setData(volumeData)
    markersRef.current?.setMarkers(markers)

    chartRef.current?.timeScale().fitContent()
  }, [candleData, maShortData, maLongData, volumeData, markers])

  useEffect(() => {
    if (!focusDate || !chartRef.current) return
    chartRef.current.timeScale().setVisibleRange({
      from: addDays(focusDate, -30) as Time,
      to: addDays(focusDate, 30) as Time,
    })
  }, [focusDate])

  return <div ref={containerRef} style={{ height: 520, width: '100%' }} />
}
