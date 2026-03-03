/**
 * Validates IP addresses and CIDR notation
 */

// IPv4 address pattern
const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// IPv4 CIDR pattern (e.g., 192.168.1.0/24)
const IPV4_CIDR_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/

// IPv6 address pattern (simplified - accepts common formats including :: for all zeros)
const IPV6_PATTERN =
  /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1}(?::[0-9a-fA-F]{1,4}){1,6}$|^(?:[0-9a-fA-F]{1,4}:){2}(?::[0-9a-fA-F]{1,4}){1,5}$|^(?:[0-9a-fA-F]{1,4}:){3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){6}:[0-9a-fA-F]{1,4}$/

// IPv6 CIDR pattern
const IPV6_CIDR_PATTERN =
  /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$/

export interface IpValidationResult {
  isValid: boolean
  errors: string[]
  validEntries: string[]
  invalidEntries: string[]
}

/**
 * Validates a single IP address or CIDR notation
 */
export function isValidIpOrCidr(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  return (
    IPV4_PATTERN.test(trimmed) ||
    IPV4_CIDR_PATTERN.test(trimmed) ||
    IPV6_PATTERN.test(trimmed) ||
    IPV6_CIDR_PATTERN.test(trimmed)
  )
}

/**
 * Validates a comma-separated or newline-separated list of IP addresses/CIDRs
 */
export function validateIpList(input: string): IpValidationResult {
  if (!input.trim()) {
    return {
      isValid: true,
      errors: [],
      validEntries: [],
      invalidEntries: [],
    }
  }

  // Split by comma, newline, or semicolon
  const entries = input
    .split(/[,\n;]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  const validEntries: string[] = []
  const invalidEntries: string[] = []

  for (const entry of entries) {
    if (isValidIpOrCidr(entry)) {
      validEntries.push(entry)
    } else {
      invalidEntries.push(entry)
    }
  }

  const errors: string[] = []
  if (invalidEntries.length > 0) {
    if (invalidEntries.length === 1) {
      errors.push(`Invalid IP address or CIDR: ${invalidEntries[0]}`)
    } else if (invalidEntries.length <= 3) {
      errors.push(`Invalid IP addresses or CIDRs: ${invalidEntries.join(', ')}`)
    } else {
      errors.push(`${invalidEntries.length} invalid IP addresses or CIDRs`)
    }
  }

  return {
    isValid: invalidEntries.length === 0,
    errors,
    validEntries,
    invalidEntries,
  }
}
