import type { Client } from '@/types'
import http from './http'

export const getClients = (params: { query?: string; limit?: number; offset?: number }, config: Record<string, unknown> = {}) =>
  http.get<{ clients: Client[]; clientsCount: number }>('/clients', { ...config, params })

export const updateClient = (id: number, client: Partial<Client>) =>
  http.put<{ client: Client }>(`/clients/${id}`, { client }).then((r) => r.client)
