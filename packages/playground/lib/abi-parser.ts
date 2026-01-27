/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Address } from 'viem'

/**
 * Parses a string value to its corresponding Solidity type
 */
export function parseSolidityType(type: string, value: string | boolean): any {
  if (value === null || value === undefined) {
    return getDefaultValue(type)
  }

  if (type === 'bool') {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1'
    }
    return false
  }

  if (type === 'address') {
    if (typeof value === 'string' && value.startsWith('0x')) {
      return value as Address
    }
    return '0x0000000000000000000000000000000000000000' as Address
  }

  if (type === 'string') {
    return String(value || '')
  }

  if (type.startsWith('bytes')) {
    if (typeof value === 'string') {
      if (value.startsWith('0x')) {
        return value
      }
      try {
        const encoder = new TextEncoder()
        const bytes = encoder.encode(value)
        return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      } catch {
        return value
      }
    }
    return value
  }

  if (type.endsWith('[]')) {
    if (Array.isArray(value)) {
      const baseType = type.slice(0, -2)
      return value.map((v) => parseSolidityType(baseType, v))
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          const baseType = type.slice(0, -2)
          return parsed.map((v) => parseSolidityType(baseType, v))
        }
      } catch {
        const baseType = type.slice(0, -2)
        return [parseSolidityType(baseType, value)]
      }
    }
    return []
  }

  const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/)
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1]
    const size = parseInt(fixedArrayMatch[2], 10)
    if (Array.isArray(value)) {
      return (value as any[]).slice(0, size).map((v: any) => parseSolidityType(baseType, v))
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.slice(0, size).map((v) => parseSolidityType(baseType, v))
        }
      } catch {
        const parsed = parseSolidityType(baseType, value)
        return Array(size).fill(parsed)
      }
    }
    const parsed = parseSolidityType(baseType, value)
    return Array(size).fill(parsed)
  }

  const uintMatch = type.match(/^u?int(\d*)$/)
  if (uintMatch) {
    if (typeof value === 'string') {
      try {
        return BigInt(value)
      } catch {
        return BigInt(0)
      }
    }
    if (typeof value === 'number') {
      return BigInt(value)
    }
    if (typeof value === 'bigint') {
      return value
    }
    return BigInt(0)
  }

  const intMatch = type.match(/^int(\d*)$/)
  if (intMatch) {
    if (typeof value === 'string') {
      try {
        return BigInt(value)
      } catch {
        return BigInt(0)
      }
    }
    if (typeof value === 'number') {
      return BigInt(value)
    }
    if (typeof value === 'bigint') {
      return value
    }
    return BigInt(0)
  }

  return value
}

/**
 * Returns the default value for a Solidity type
 */
function getDefaultValue(type: string): any {
  if (type === 'bool') return false
  if (type === 'address') return '0x0000000000000000000000000000000000000000' as Address
  if (type === 'string') return ''
  if (type.startsWith('bytes')) return '0x'
  if (type.endsWith('[]')) return []
  if (type.match(/^(.+)\[(\d+)\]$/)) return []
  if (type.match(/^u?int/)) return BigInt(0)
  if (type.match(/^int/)) return BigInt(0)
  return ''
}

/**
 * Formats a return value to display it in the UI
 */
export function formatReturnValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
  }

  return String(value)
}
