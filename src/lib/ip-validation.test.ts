import { describe, it, expect } from 'vitest'
import { isValidIpOrCidr, validateIpList } from './ip-validation'

describe('isValidIpOrCidr', () => {
  describe('IPv4 addresses', () => {
    it('accepts valid IPv4 addresses', () => {
      expect(isValidIpOrCidr('192.168.1.1')).toBe(true)
      expect(isValidIpOrCidr('10.0.0.1')).toBe(true)
      expect(isValidIpOrCidr('172.16.0.1')).toBe(true)
      expect(isValidIpOrCidr('0.0.0.0')).toBe(true)
      expect(isValidIpOrCidr('255.255.255.255')).toBe(true)
    })

    it('rejects invalid IPv4 addresses', () => {
      expect(isValidIpOrCidr('256.1.1.1')).toBe(false)
      expect(isValidIpOrCidr('192.168.1')).toBe(false)
      expect(isValidIpOrCidr('192.168.1.1.1')).toBe(false)
      expect(isValidIpOrCidr('192.168.1.a')).toBe(false)
      expect(isValidIpOrCidr('192.168.-1.1')).toBe(false)
    })
  })

  describe('IPv4 CIDR notation', () => {
    it('accepts valid IPv4 CIDR ranges', () => {
      expect(isValidIpOrCidr('192.168.1.0/24')).toBe(true)
      expect(isValidIpOrCidr('10.0.0.0/8')).toBe(true)
      expect(isValidIpOrCidr('172.16.0.0/12')).toBe(true)
      expect(isValidIpOrCidr('0.0.0.0/0')).toBe(true)
      expect(isValidIpOrCidr('192.168.1.1/32')).toBe(true)
    })

    it('rejects invalid IPv4 CIDR ranges', () => {
      expect(isValidIpOrCidr('192.168.1.0/33')).toBe(false)
      expect(isValidIpOrCidr('192.168.1.0/-1')).toBe(false)
      expect(isValidIpOrCidr('192.168.1.0/')).toBe(false)
      expect(isValidIpOrCidr('256.1.1.1/24')).toBe(false)
    })
  })

  describe('IPv6 addresses', () => {
    it('accepts valid IPv6 addresses', () => {
      expect(isValidIpOrCidr('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
      expect(isValidIpOrCidr('::1')).toBe(true)
      expect(isValidIpOrCidr('::')).toBe(true)
      expect(isValidIpOrCidr('fe80::1')).toBe(true)
    })

    it('rejects invalid IPv6 addresses', () => {
      expect(isValidIpOrCidr('2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(false)
      expect(isValidIpOrCidr('gggg::1')).toBe(false)
    })
  })

  describe('IPv6 CIDR notation', () => {
    it('accepts valid IPv6 CIDR ranges', () => {
      expect(isValidIpOrCidr('2001:db8::/32')).toBe(true)
      expect(isValidIpOrCidr('fe80::1/64')).toBe(true)
      expect(isValidIpOrCidr('::1/128')).toBe(true)
      expect(isValidIpOrCidr('::/0')).toBe(true)
      expect(isValidIpOrCidr('2001:0db8:85a3:0000:0000:8a2e:0370:7334/64')).toBe(true)
    })

    it('rejects invalid IPv6 CIDR ranges', () => {
      expect(isValidIpOrCidr('fe80::1/129')).toBe(false)
      expect(isValidIpOrCidr('fe80::1/')).toBe(false)
      expect(isValidIpOrCidr('gggg::1/64')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('rejects empty strings', () => {
      expect(isValidIpOrCidr('')).toBe(false)
    })

    it('rejects whitespace-only strings', () => {
      expect(isValidIpOrCidr('   ')).toBe(false)
    })

    it('trims whitespace from valid IPs', () => {
      expect(isValidIpOrCidr('  192.168.1.1  ')).toBe(true)
    })

    it('rejects hostnames', () => {
      expect(isValidIpOrCidr('localhost')).toBe(false)
      expect(isValidIpOrCidr('example.com')).toBe(false)
    })

    it('rejects partial entries', () => {
      expect(isValidIpOrCidr('192.168')).toBe(false)
      expect(isValidIpOrCidr('192.')).toBe(false)
    })
  })
})

describe('validateIpList', () => {
  describe('empty input', () => {
    it('returns valid for empty string', () => {
      const result = validateIpList('')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.validEntries).toHaveLength(0)
      expect(result.invalidEntries).toHaveLength(0)
    })

    it('returns valid for whitespace-only string', () => {
      const result = validateIpList('   ')
      expect(result.isValid).toBe(true)
    })
  })

  describe('single entries', () => {
    it('validates a single valid IP', () => {
      const result = validateIpList('192.168.1.1')
      expect(result.isValid).toBe(true)
      expect(result.validEntries).toEqual(['192.168.1.1'])
      expect(result.invalidEntries).toHaveLength(0)
    })

    it('validates a single invalid IP', () => {
      const result = validateIpList('invalid')
      expect(result.isValid).toBe(false)
      expect(result.validEntries).toHaveLength(0)
      expect(result.invalidEntries).toEqual(['invalid'])
      expect(result.errors[0]).toContain('invalid')
    })
  })

  describe('multiple entries', () => {
    it('handles comma-separated IPs', () => {
      const result = validateIpList('192.168.1.1, 10.0.0.1, 172.16.0.1')
      expect(result.isValid).toBe(true)
      expect(result.validEntries).toHaveLength(3)
    })

    it('handles newline-separated IPs', () => {
      const result = validateIpList('192.168.1.1\n10.0.0.1\n172.16.0.1')
      expect(result.isValid).toBe(true)
      expect(result.validEntries).toHaveLength(3)
    })

    it('handles semicolon-separated IPs', () => {
      const result = validateIpList('192.168.1.1; 10.0.0.1; 172.16.0.1')
      expect(result.isValid).toBe(true)
      expect(result.validEntries).toHaveLength(3)
    })

    it('handles mixed valid and invalid entries', () => {
      const result = validateIpList('192.168.1.1, invalid, 10.0.0.1')
      expect(result.isValid).toBe(false)
      expect(result.validEntries).toHaveLength(2)
      expect(result.invalidEntries).toHaveLength(1)
    })

    it('handles multiple invalid entries with appropriate error message', () => {
      const result = validateIpList('invalid1, invalid2, invalid3, invalid4')
      expect(result.isValid).toBe(false)
      expect(result.invalidEntries).toHaveLength(4)
      expect(result.errors[0]).toContain('4 invalid')
    })
  })

  describe('CIDR notation', () => {
    it('validates CIDR ranges in list', () => {
      const result = validateIpList('192.168.1.0/24, 10.0.0.0/8')
      expect(result.isValid).toBe(true)
      expect(result.validEntries).toHaveLength(2)
    })

    it('handles mixed IPs and CIDRs', () => {
      const result = validateIpList('192.168.1.1, 10.0.0.0/8, 172.16.0.1')
      expect(result.isValid).toBe(true)
      expect(result.validEntries).toHaveLength(3)
    })
  })
})
