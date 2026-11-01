import { describe, expect, it } from 'vitest'
import { formatPhone, randomPassword } from './format'

describe('formatPhone', () => {
  it('groups ten digits', () => expect(formatPhone('0900123456')).toBe('0900 123 456'))
  it('is null safe', () => {
    expect(formatPhone(null)).toBe('')
    expect(formatPhone(undefined)).toBe('')
  })
  it('keeps unknown formats', () => expect(formatPhone('+421 900 123 456')).toBe('+421 900 123 456'))
})

describe('randomPassword', () => {
  it('has the requested length', () => expect(randomPassword(10)).toHaveLength(10))
})
