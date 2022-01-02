import request from '@/utils/request'

export const getStats = (params: any) =>
  request({
    url: '/stats',
    method: 'get',
    params
  })

export const getInstructorsStats = (params: any) =>
  request({
    url: '/instructors-stats',
    method: 'get',
    params
  })


