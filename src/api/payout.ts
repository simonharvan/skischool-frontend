import request from '@/utils/request'

export const getPayouts = (params: any) =>
  request({
    url: '/payout',
    method: 'get',
    params: params
  })

export const sendPayout = (data: any) =>
  request({
    url: '/payout',
    method: 'post',
    data: data
  })


