import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIpValidation } from './use-ip-validation'

describe('useIpValidation', () => {
  it('starts with null validation state', () => {
    const { result } = renderHook(() => useIpValidation())
    expect(result.current.ipValidation).toBeNull()
    expect(result.current.hasValidationError).toBe(false)
  })

  it('validates valid IPs', () => {
    const { result } = renderHook(() => useIpValidation())

    act(() => {
      result.current.validateIps('192.168.1.1')
    })

    expect(result.current.ipValidation).not.toBeNull()
    expect(result.current.ipValidation!.isValid).toBe(true)
    expect(result.current.hasValidationError).toBe(false)
  })

  it('validates invalid IPs', () => {
    const { result } = renderHook(() => useIpValidation())

    act(() => {
      result.current.validateIps('not-an-ip')
    })

    expect(result.current.ipValidation).not.toBeNull()
    expect(result.current.ipValidation!.isValid).toBe(false)
    expect(result.current.hasValidationError).toBe(true)
  })

  it('sets null for empty input', () => {
    const { result } = renderHook(() => useIpValidation())

    act(() => {
      result.current.validateIps('192.168.1.1')
    })
    expect(result.current.ipValidation).not.toBeNull()

    act(() => {
      result.current.validateIps('')
    })
    expect(result.current.ipValidation).toBeNull()
    expect(result.current.hasValidationError).toBe(false)
  })

  it('resets validation state', () => {
    const { result } = renderHook(() => useIpValidation())

    act(() => {
      result.current.validateIps('not-an-ip')
    })
    expect(result.current.hasValidationError).toBe(true)

    act(() => {
      result.current.resetValidation()
    })
    expect(result.current.ipValidation).toBeNull()
    expect(result.current.hasValidationError).toBe(false)
  })

  it('validates comma-separated list', () => {
    const { result } = renderHook(() => useIpValidation())

    act(() => {
      result.current.validateIps('192.168.1.1, 10.0.0.1')
    })

    expect(result.current.ipValidation!.isValid).toBe(true)
    expect(result.current.ipValidation!.validEntries).toHaveLength(2)
  })
})
