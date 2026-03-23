import { describe, expect, it } from 'vitest'
import { buildSkippedSerialRetryValue } from './serialImportViewState'

describe('buildSkippedSerialRetryValue', () => {
  it('keeps only non-blank skipped serials for retry input', () => {
    expect(
      buildSkippedSerialRetryValue([
        { serial: ' SERIAL-001 ', reason: 'Duplicate serial in request' },
        { serial: '', reason: 'serial must not be blank' },
        { serial: 'SERIAL-002', reason: 'Serial already exists' },
      ]),
    ).toBe('SERIAL-001\nSERIAL-002')
  })
})
