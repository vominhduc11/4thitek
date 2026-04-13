// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WholesaleDiscountsPageRevamp from './WholesaleDiscountsPageRevamp'

const {
  addDiscountRuleMock,
  updateDiscountRuleMock,
  updateDiscountRuleStatusMock,
  reloadResourceMock,
  notifyMock,
  confirmMock,
} = vi.hoisted(() => ({
  addDiscountRuleMock: vi.fn(),
  updateDiscountRuleMock: vi.fn(),
  updateDiscountRuleStatusMock: vi.fn(),
  reloadResourceMock: vi.fn(),
  notifyMock: vi.fn(),
  confirmMock: vi.fn(async () => true),
}))

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'vi',
    t: (value: string) => value,
  }),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}))

vi.mock('../hooks/useConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: confirmMock,
    confirmDialog: null,
  }),
}))

vi.mock('../context/AdminDataContext', () => ({
  useAdminData: () => ({
    discountRules: [
      {
        id: '1',
        fromQuantity: 1,
        toQuantity: 10,
        rangeLabel: '1 - 10',
        percent: 10,
        status: 'active',
        updatedAt: '2026-04-12T08:30:00Z',
      },
      {
        id: '4',
        fromQuantity: 51,
        toQuantity: null,
        rangeLabel: '51+',
        percent: 40,
        status: 'draft',
        updatedAt: '2026-04-12T08:30:00Z',
      },
    ],
    discountRulesState: { status: 'success', error: null, lastLoadedAt: Date.now() },
    addDiscountRule: addDiscountRuleMock,
    updateDiscountRule: updateDiscountRuleMock,
    updateDiscountRuleStatus: updateDiscountRuleStatusMock,
    reloadResource: reloadResourceMock,
  }),
}))

describe('WholesaleDiscountsPageRevamp', () => {
  beforeEach(() => {
    addDiscountRuleMock.mockReset()
    updateDiscountRuleMock.mockReset()
    updateDiscountRuleStatusMock.mockReset()
    reloadResourceMock.mockReset()
    notifyMock.mockReset()
    confirmMock.mockReset()
    confirmMock.mockResolvedValue(true)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders open-ended tiers as 51+ and infinity in the table', () => {
    render(<WholesaleDiscountsPageRevamp />)

    expect(screen.getAllByText('51+').length).toBeGreaterThan(0)
    expect(screen.getAllByText('∞').length).toBeGreaterThan(0)
  })

  it('blocks invalid structured input before submit', () => {
    render(<WholesaleDiscountsPageRevamp />)

    fireEvent.click(screen.getByRole('button', { name: 'Thêm bậc' }))
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '20' } })
    fireEvent.change(inputs[1], { target: { value: '10' } })
    fireEvent.change(inputs[2], { target: { value: '10' } })

    fireEvent.click(screen.getByRole('button', { name: 'Tạo bậc' }))

    expect(addDiscountRuleMock).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Vui lòng nhập fromQuantity >= 1, toQuantity hợp lệ và phần trăm trong khoảng 1-100.',
      ),
    ).toBeTruthy()
  })

  it('submits canonical structured payloads for new quantity tiers', async () => {
    addDiscountRuleMock.mockResolvedValue({
      id: '9',
      fromQuantity: 11,
      toQuantity: 20,
      rangeLabel: '11 - 20',
      percent: 20,
      status: 'active',
      updatedAt: '2026-04-12T09:00:00Z',
    })

    render(<WholesaleDiscountsPageRevamp />)

    fireEvent.click(screen.getByRole('button', { name: 'Thêm bậc' }))
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '11' } })
    fireEvent.change(inputs[1], { target: { value: '20' } })
    fireEvent.change(inputs[2], { target: { value: '20' } })
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: 'active' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tạo bậc' }))

    await waitFor(() => {
      expect(addDiscountRuleMock).toHaveBeenCalledWith({
        fromQuantity: 11,
        toQuantity: 20,
        percent: 20,
        status: 'active',
      })
    })
  })

  it('surfaces backend overlap errors instead of swallowing them', async () => {
    addDiscountRuleMock.mockRejectedValue(
      new Error('Active discount tiers overlap at boundary between 1 - 10 and 10 - 20'),
    )

    render(<WholesaleDiscountsPageRevamp />)

    fireEvent.click(screen.getByRole('button', { name: 'Thêm bậc' }))
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '10' } })
    fireEvent.change(inputs[1], { target: { value: '20' } })
    fireEvent.change(inputs[2], { target: { value: '20' } })

    fireEvent.click(screen.getByRole('button', { name: 'Tạo bậc' }))

    expect(
      await screen.findByText('Active discount tiers overlap at boundary between 1 - 10 and 10 - 20'),
    ).toBeTruthy()
  })
})
