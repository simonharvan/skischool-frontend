import request from '@/utils/request'

export const getClients = (params: any) =>
  request({
    url: '/clients',
    method: 'get',
    params
  })


