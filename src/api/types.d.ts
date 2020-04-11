export interface IInstructor {
  id: number
  name: string
  email: string
  phone: string
  gender: string
  teaching: string
}

export interface IClient {
  id: number
  name: string
  email: string
  phone: string
  phone_2?: string
}

export interface ILesson {
  id: number
  from: string
  to: string
  name: string
  type: string
  price: number
  status: string
  instructor?: IInstructor
  client?: IClient
}