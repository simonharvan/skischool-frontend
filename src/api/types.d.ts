export interface IArticleData {
  id: number
  status: string
  title: string
  abstractContent: string
  fullContent: string
  sourceURL: string
  imageURL: string
  timestamp: string | number
  platforms: string[]
  disableComment: boolean
  importance: number
  author: string
  reviewer: string
  type: string
  pageviews: number
}

export interface IRoleData {
  key: string
  name: string
  description: string
  routes: any
}

export interface ITransactionData {
  orderId: string
  timestamp: string | number
  username: string
  price: number
  status: string
}

export interface IUserData {
  id: number
  username: string
  password: string
  name: string
  email: string
  phone: string
  avatar: string
  introduction: string
  roles: string[]
}

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
  instructor: IInstructor
  client: IClient
}