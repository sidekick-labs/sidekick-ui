import { useState, useCallback } from 'react'
import { validateIpList, type IpValidationResult } from '@/lib/ip-validation'

interface UseIpValidationReturn {
  ipValidation: IpValidationResult | null
  validateIps: (value: string) => void
  resetValidation: () => void
  hasValidationError: boolean
}

/**
 * Hook for managing IP address validation state in forms.
 * Provides real-time validation feedback for IP address/CIDR input fields.
 */
export function useIpValidation(): UseIpValidationReturn {
  const [ipValidation, setIpValidation] = useState<IpValidationResult | null>(null)

  const validateIps = useCallback((value: string) => {
    if (value.trim()) {
      setIpValidation(validateIpList(value))
    } else {
      setIpValidation(null)
    }
  }, [])

  const resetValidation = useCallback(() => {
    setIpValidation(null)
  }, [])

  const hasValidationError = ipValidation !== null && !ipValidation.isValid

  return {
    ipValidation,
    validateIps,
    resetValidation,
    hasValidationError,
  }
}
