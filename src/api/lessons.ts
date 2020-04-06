import request from '@/utils/request'

export const getLessons = (params: any) =>
  request({
    url: '/lessons',
    method: 'get',
    params
  })

export const updateLesson = (id: number, data: any) =>
    request({
        url: `/lessons/${id}`,
        method: 'put',
        data
    })


