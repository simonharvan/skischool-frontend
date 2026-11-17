import http from './http'

export const login = (email: string, password: string) =>
  http.post<{ token: string; user: { name: string; email: string } }>('/auth/login', { email, password }, { silent: true, timeout: 10000 })

export const me = () => http.get<{ name: string; email: string }>('/me')

export const logout = () => http.post('/auth/logout')
