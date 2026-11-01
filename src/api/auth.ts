import http from './http'

export const login = (email: string, password: string) =>
  http.post<{ access_token: string }>('/auth/login', { user: { email, password } }, { silent: true })

export const me = () => http.get<{ name: string; email: string }>('/me')

export const logout = () => http.post('/auth/logout')
