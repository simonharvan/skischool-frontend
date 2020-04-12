import request from '@/utils/request'

export const getStats = () =>
  request({
    url: '/stats',
    method: 'get',

  })

export const getInstructorsStats = () =>
    request({
        url: '/instructors-stats',
        method: 'get',
    })


