import { describe, expect, it } from 'vitest'
import { getAllowedDealerStatuses } from './adminLabels'

describe('adminLabels dealer lifecycle', () => {
  it('only allows active dealers to stay active or suspend', () => {
    expect(getAllowedDealerStatuses('active')).toEqual(['active', 'suspended'])
  })

  it('allows under-review dealers to activate or suspend', () => {
    expect(getAllowedDealerStatuses('under_review')).toEqual(['under_review', 'active', 'suspended'])
  })

  it('allows suspended dealers to reactivate without reopening review', () => {
    expect(getAllowedDealerStatuses('suspended')).toEqual(['suspended', 'active'])
  })
})
