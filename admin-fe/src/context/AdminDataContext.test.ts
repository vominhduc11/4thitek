import { describe, expect, it } from 'vitest'
import { getRequiredResources } from './AdminDataContext'

describe('getRequiredResources', () => {
  it('loads orders only for order detail routes', () => {
    expect(getRequiredResources('/orders', false)).toEqual([])
    expect(getRequiredResources('/orders/123', false)).toEqual(['orders'])
  })

  it('blocks user management resources for non-super-admin accounts', () => {
    expect(getRequiredResources('/users', false)).toEqual([])
    expect(getRequiredResources('/users', true)).toEqual(['users'])
  })

  it('loads dealer accounts for dealer details and payment filters only', () => {
    expect(getRequiredResources('/dealers', false)).toEqual([])
    expect(getRequiredResources('/dealers/42', false)).toEqual(['dealers'])
    expect(getRequiredResources('/payments/recent', false)).toEqual(['dealers'])
  })

  it('maps settings pages to the settings resource', () => {
    expect(getRequiredResources('/settings/company', true)).toEqual(['settings'])
    expect(getRequiredResources('/settings/company', false)).toEqual([])
  })
})
