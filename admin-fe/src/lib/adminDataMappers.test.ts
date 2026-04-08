import { describe, expect, it } from 'vitest'
import { mapBackendSettings, mapOrder, toBlogUpsertRequest } from './adminDataMappers'

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
      outstandingAmount: 'NaN',
      itemCount: 2,
      address: '123 Test',
      note: null,
      createdAt: '2026-03-13T00:00:00Z',
      allowedTransitions: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    })

    expect(mapped.total).toBe(0)
    expect(mapped.paidAmount).toBe(0)
    expect(mapped.outstandingAmount).toBe(0)
    expect(mapped.orderCode).toBe('SCS-42')
    expect(mapped.allowedTransitions).toEqual(['pending', 'confirmed', 'cancelled'])
  })

  it('maps nested admin settings payloads', () => {
    const mapped = mapBackendSettings({
      id: 1,
      emailConfirmation: true,
      sessionTimeoutMinutes: 45,
      orderAlerts: true,
      inventoryAlerts: false,
      vatPercent: 8,
      sepay: {
        enabled: true,
        webhookToken: 'token-123',
        bankName: 'ACB',
        accountNumber: '123456789',
        accountHolder: 'CÔNG TY TNHH 4T HITEK',
      },
      emailSettings: {
        enabled: true,
        from: 'info@4thitek.vn',
        fromName: '4T HITEK',
      },
      rateLimitOverrides: {
        enabled: true,
        auth: { requests: 12, windowSeconds: 60 },
        passwordReset: { requests: 6, windowSeconds: 300 },
        warrantyLookup: { requests: 40, windowSeconds: 60 },
        upload: { requests: 25, windowSeconds: 60 },
        webhook: { requests: 180, windowSeconds: 60 },
      },
    })

    expect(mapped.sepay.enabled).toBe(true)
    expect(mapped.sepay.webhookToken).toBe('token-123')
    expect(mapped.emailSettings.from).toBe('info@4thitek.vn')
    expect(mapped.vatPercent).toBe(8)
    expect(mapped.rateLimitOverrides.auth.requests).toBe(12)
    expect(mapped.rateLimitOverrides.webhook.requests).toBe(180)
  })

  it('preserves full blog content when building an upsert request', () => {
    const request = toBlogUpsertRequest({
      title: 'Launch update',
      category: 'News',
      excerpt: 'Short summary',
      content: 'Paragraph one.\n\nParagraph two.',
      status: 'published',
      showOnHomepage: false,
    })

    expect(request.showOnHomepage).toBe(false)
    expect(request.introduction).toContain('Paragraph one.')
    expect(request.introduction).toContain('Paragraph two.')
  })
})
