import { apiGet, type RequestOptions } from './client.ts'

export interface PingResponse {
  message: string
  serverTime: string
}

export function getPing({ signal }: RequestOptions = {}): Promise<PingResponse> {
  return apiGet<PingResponse>('/ping', { signal })
}
