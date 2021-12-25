import request from '@/utils/request'

export const getClients = (params: any) =>
  request({
    url: '/clients',
    method: 'get',
    params
  })

export const updateClient = (id: number, data: any) =>
  request({
    url: `/clients/${id}`,
    method: 'put',
    data
  })

