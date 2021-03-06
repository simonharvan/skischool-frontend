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

export interface IAttendance {
  id: number
  from: string
  to: string
  instructor?: IInstructor
}

export interface IStats {
  clients: number
  duration: number
  unpaid: number
  paid: number
  best_instructor: string
  best_instructor_duration: number
}

export interface IInstructorsStats {
  name: string
  duration: number
  total: number
}