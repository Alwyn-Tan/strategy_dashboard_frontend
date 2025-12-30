import { apiClient } from './client'
import type { CodeItem, Signal, SignalsQueryParams, SignalsResponse, StockDataQueryParams, StockDataResponse } from './types'

export async function fetchCodes(): Promise<CodeItem[]> {
  const resp = await apiClient.get<CodeItem[]>('/api/codes/')
  return resp.data
}

export async function fetchStockData(params: StockDataQueryParams): Promise<StockDataResponse> {
  const resp = await apiClient.get<StockDataResponse>('/api/stock-data/', { params })
  return resp.data
}

export async function fetchSignals(params: SignalsQueryParams): Promise<SignalsResponse> {
  const resp = await apiClient.get<SignalsResponse | Signal[]>('/api/signals/', { params })
  if (Array.isArray(resp.data)) {
    return { data: resp.data, meta: { generated_count: resp.data.length, returned_count: resp.data.length, params: {} } }
  }
  return resp.data
}
