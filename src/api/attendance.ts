import request from '@/utils/request'

export const getAttendance = (params: any) =>
  request({
    url: '/attendance',
    method: 'get',
    params
  })

export const bulkCreateAttendance = (data: any) =>
    request({
        url: '/attendance/bulk',
        method: 'post',
        data
    })

export const bulkDeleteAttendance = (data: any) =>
    request({
        url: '/attendance/bulk',
        method: 'delete',
        data
    })


