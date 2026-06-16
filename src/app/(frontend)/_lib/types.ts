import type { Member } from '@/payload-types'

export type { Member }

export type SafeMember = Pick<Member, 'id' | 'email' | 'firstName' | 'lastName' | 'status'>

export interface AuthResponse {
    user?: Member
    token?: string
    message?: string
}

export interface RegisterInput {
    email: string
    password: string
    firstName?: string
    lastName?: string
}
