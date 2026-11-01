import type { Client } from '@/types'
import http from './http'

export const getClients = (params: { query?: string; limit?: number; offset?: number }) =>
  http.get<{ clients: Client[]; clientsCount: number }>('/clients', { params })

export const updateClient = (id: number, client: Partial<Client>) =>
  http.put<{ client: Client }>(`/clients/${id}`, { client }).then((r) => r.client)
