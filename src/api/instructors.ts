import request from '@/utils/request'

export const getInstructors = (params: any) =>
  request({
    url: '/instructors',
    method: 'get',
    params
  })


