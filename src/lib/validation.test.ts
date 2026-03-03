import { describe, it, expect } from 'vitest'
import { isValidEmail } from './validation'

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('test.user@domain.co')).toBe(true)
    expect(isValidEmail('name+tag@company.org')).toBe(true)
    expect(isValidEmail('a@b.c')).toBe(true)
  })

  it('rejects emails without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects emails without domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects emails without local part', () => {
    expect(isValidEmail('@example.com')).toBe(false)
  })

  it('rejects emails with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
    expect(isValidEmail('user@ example.com')).toBe(false)
  })

  it('rejects emails without TLD dot', () => {
    expect(isValidEmail('user@example')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })
})
