import { describe, it, expect } from 'vitest'
import { parseJsonError, formatJson } from './json-utils'

describe('parseJsonError', () => {
  it('returns null for valid JSON', () => {
    expect(parseJsonError('{"key": "value"}')).toBeNull()
    expect(parseJsonError('[]')).toBeNull()
    expect(parseJsonError('"string"')).toBeNull()
    expect(parseJsonError('123')).toBeNull()
    expect(parseJsonError('null')).toBeNull()
  })

  it('returns error message for invalid JSON', () => {
    const result = parseJsonError('{invalid}')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('returns error for empty string', () => {
    const result = parseJsonError('')
    expect(result).toBeTruthy()
  })

  it('returns error for trailing comma', () => {
    const result = parseJsonError('{"key": "value",}')
    expect(result).toBeTruthy()
  })

  it('returns error for unquoted keys', () => {
    const result = parseJsonError('{key: "value"}')
    expect(result).toBeTruthy()
  })
})

describe('formatJson', () => {
  it('formats compact JSON with indentation', () => {
    const result = formatJson('{"key":"value","nested":{"a":1}}')
    expect(result).toBe('{\n  "key": "value",\n  "nested": {\n    "a": 1\n  }\n}')
  })

  it('formats arrays', () => {
    const result = formatJson('[1,2,3]')
    expect(result).toBe('[\n  1,\n  2,\n  3\n]')
  })

  it('returns original string for invalid JSON', () => {
    const invalid = '{not valid json}'
    expect(formatJson(invalid)).toBe(invalid)
  })

  it('normalizes already-formatted JSON', () => {
    const formatted = '{\n    "key":    "value"\n}'
    const result = formatJson(formatted)
    expect(result).toBe('{\n  "key": "value"\n}')
  })
})
