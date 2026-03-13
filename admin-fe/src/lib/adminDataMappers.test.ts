import { describe, expect, it } from 'vitest'
import { mapOrder } from './adminDataMappers'

describe('adminDataMappers', () => {
  it('falls back to zero when numeric order fields are malformed', () => {
    const mapped = mapOrder({
      id: 42,
      orderCode: 'SCS-42',
      dealerName: 'Dealer A',
      totalAmount: 'not-a-number',
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING',
      paidAmount: 'NaN',
      itemCount: 2,
      address: '123 Test',
      note: null,
      createdAt: '2026-03-13T00:00:00Z',
    })

    expect(mapped.total).toBe(0)
    expect(mapped.paidAmount).toBe(0)
    expect(mapped.outstandingAmount).toBe(0)
  })
})
