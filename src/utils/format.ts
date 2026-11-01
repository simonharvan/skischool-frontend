/** `0900123456` -> `0900 123 456`; anything else is returned as it is. Null-safe. */
export const formatPhone = (phone?: string | null): string => {
  if (!phone) return ''
  const digits = phone.replace(/\s+/g, '')
  return /^\d{10}$/.test(digits) ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : phone
}

export const randomPassword = (length = 8): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
