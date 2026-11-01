export type Gender = 'male' | 'female'
export type Teaching = 'ski' | 'snb' | 'both'
export type LessonType = 'ski' | 'snb'
export type LessonStatus = 'paid' | 'unpaid'

export interface Instructor {
  id: number
  name: string
  email: string
  phone: string | null
  gender: Gender
  teaching: Teaching
}

export interface Client {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  phone_2?: string | null
}

export interface Lesson {
  id: number
  from: string
  to: string
  name: string
  type: LessonType
  price: number
  persons_count: number
  status: LessonStatus
  note: string | null
  instructor_paid?: boolean
  instructor?: Instructor | null
  client?: Client | null
  is_time_off?: boolean
}

export interface Attendance {
  id: number
  from: string
  to: string
  instructor?: Instructor | null
}

export interface Stats {
  clients: number
  duration: number
  unpaid: number
  paid: number
  best_instructor: string | null
  best_instructor_duration: number
}

export interface DurationByPersons {
  persons_1: number
  persons_2: number
  persons_3: number
  persons_4: number
}

export interface InstructorStats {
  name: string
  duration: number
  total: number
  duration_by_persons: DurationByPersons
}

export interface AlreadyPaidOut {
  amount: number
  paid_at: string
}

export interface PayoutStats {
  earned_approx: number
  total: number
  total_by_person: DurationByPersons
}

export interface Payout {
  instructor: Instructor
  lessons: Lesson[]
  stats: PayoutStats
  payouts: AlreadyPaidOut[]
}

/** Payload of POST/PUT /lessons (wrapped in `{lesson}`). */
export interface LessonPayload {
  id?: number
  from: string
  to: string
  name?: string
  type: LessonType
  price: number
  note?: string | null
  persons_count: number
  instructor_id: number
  is_time_off?: boolean
  client?: Partial<Client>
}
