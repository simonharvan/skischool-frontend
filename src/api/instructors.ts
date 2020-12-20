import request from '@/utils/request'

export const getInstructors = (params: any) =>
  request({
    url: '/instructors',
    method: 'get',
    params
  })


export const createInstructor = (data: any) =>
    request({
        url: '/instructors',
        method: 'post',
        data
    })


export const updateInstructor = (id: number, data: any) =>
    request({
        url: `/instructors/${id}`,
        method: 'put',
        data
    })

export const deleteInstructor = (id: number) =>
    request({
        url: `/instructors/${id}`,
        method: 'delete',
    })


