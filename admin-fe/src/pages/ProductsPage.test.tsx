// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import ProductsPage from './ProductsPage'

function ProductDetailStub() {
  const { sku = '' } = useParams()
  return <div>Sản phẩm {sku}</div>
}

const { notifyMock, archiveProductMock, restoreProductMock, togglePublishStatusMock, deleteProductMock, addProductMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  archiveProductMock: vi.fn(),
  restoreProductMock: vi.fn(),
  togglePublishStatusMock: vi.fn(),
  deleteProductMock: vi.fn(),
  addProductMock: vi.fn(),
}))

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (value: string, vars?: Record<string, string | number>) =>
      vars ? value.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? '')) : value,
  }),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}))

vi.mock('../hooks/useConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    confirmDialog: null,
  }),
}))

vi.mock('../context/ProductsContext', () => ({
  useProducts: () => ({
    products: [
      {
        id: '42',
        name: 'Pin du phong 42',
        sku: 'SKU-42',
        shortDescription: 'Low stock product',
        status: 'Active',
        publishStatus: 'PUBLISHED',
        availableStock: 4,
        retailPrice: 200000,
        warrantyPeriod: 12,
        image: '{"imageUrl":"/uploads/p42.png"}',
        descriptions: '[]',
        videos: '[]',
        specifications: '[]',
        showOnHomepage: false,
        isFeatured: false,
        isDeleted: false,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
      {
        id: '43',
        name: 'Pin du phong 43',
        sku: 'SKU-43',
        shortDescription: 'Low stock but not urgent product',
        status: 'Active',
        publishStatus: 'PUBLISHED',
        availableStock: 8,
        retailPrice: 250000,
        warrantyPeriod: 12,
        image: '{"imageUrl":"/uploads/p43.png"}',
        descriptions: '[]',
        videos: '[]',
        specifications: '[]',
        showOnHomepage: false,
        isFeatured: false,
        isDeleted: false,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
      {
        id: '44',
        name: 'Pin du phong 44',
        sku: 'SKU-44',
        shortDescription: 'Healthy stock product',
        status: 'Active',
        publishStatus: 'PUBLISHED',
        availableStock: 25,
        retailPrice: 260000,
        warrantyPeriod: 12,
        image: '{"imageUrl":"/uploads/p44.png"}',
        descriptions: '[]',
        videos: '[]',
        specifications: '[]',
        showOnHomepage: false,
        isFeatured: false,
        isDeleted: false,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
    ],
    isLoading: false,
    error: null,
    archiveProduct: archiveProductMock,
    restoreProduct: restoreProductMock,
    togglePublishStatus: togglePublishStatusMock,
    deleteProduct: deleteProductMock,
    addProduct: addProductMock,
  }),
}))

const renderPage = (initialEntry = '/products?inventoryAlert=urgent&productId=42') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:sku" element={<ProductDetailStub />} />
      </Routes>
    </MemoryRouter>,
  )

describe('ProductsPage', () => {
  beforeEach(() => {
    notifyMock.mockReset()
    archiveProductMock.mockReset()
    restoreProductMock.mockReset()
    togglePublishStatusMock.mockReset()
    deleteProductMock.mockReset()
    addProductMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('applies inventory alert context from query params and highlights the targeted SKU', () => {
    renderPage()

    expect(screen.getByText('Đang xem cảnh báo tồn kho khẩn cấp')).toBeTruthy()
    expect(screen.getByText('Ưu tiên rà soát SKU SKU-42 để lên kế hoạch bổ sung hàng.')).toBeTruthy()
    expect(screen.getByText('Cảnh báo khẩn')).toBeTruthy()
    expect(screen.getByText('Pin du phong 42')).toBeTruthy()
    expect(screen.queryByText('Pin du phong 43')).toBeNull()
    expect(screen.queryByText('Pin du phong 44')).toBeNull()
  })

  describe('Quick Add', () => {
    const openQuickAddModal = async () => {
      const user = userEvent.setup()
      renderPage('/products')
      await user.click(screen.getByRole('button', { name: 'Thêm sản phẩm' }))
      return user
    }

    it('gửi SKU trong payload và điều hướng tới /products/:sku sau khi tạo', async () => {
      addProductMock.mockResolvedValue({ id: '99', sku: 'SCS-S9-PRO' })
      const user = await openQuickAddModal()

      await user.type(screen.getByLabelText(/Tên sản phẩm/), 'SCS S9 Pro')
      await user.type(screen.getByLabelText(/SKU/), 'SCS-S9-PRO')
      await user.click(screen.getByRole('button', { name: 'Tạo sản phẩm' }))

      expect(addProductMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SCS S9 Pro', sku: 'SCS-S9-PRO', publishStatus: 'DRAFT' }),
      )
      expect(await screen.findByText('Sản phẩm SCS-S9-PRO')).toBeTruthy()
    })

    it('nút "Tạo từ tên" sinh SKU từ tên có dấu tiếng Việt', async () => {
      const user = await openQuickAddModal()

      await user.type(screen.getByLabelText(/Tên sản phẩm/), 'Mũ bảo hiểm Đà Nẵng')
      await user.click(screen.getByRole('button', { name: 'Tạo từ tên' }))

      const skuInput = screen.getByLabelText(/SKU/) as HTMLInputElement
      expect(skuInput.value).toMatch(/^MU-BAO-HIEM-DA-NANG-[A-Z0-9]{4}$/)
    })

    it('hiển thị lỗi inline khi SKU trùng (409), không điều hướng', async () => {
      addProductMock.mockRejectedValue(new Error('SKU already exists'))
      const user = await openQuickAddModal()

      await user.type(screen.getByLabelText(/Tên sản phẩm/), 'SCS S9 Pro')
      await user.type(screen.getByLabelText(/SKU/), 'SKU-42')
      await user.click(screen.getByRole('button', { name: 'Tạo sản phẩm' }))

      expect(await screen.findByRole('alert')).toBeTruthy()
      expect(screen.getByText('SKU "SKU-42" đã tồn tại. Hãy chọn SKU khác.')).toBeTruthy()
      expect(notifyMock).not.toHaveBeenCalled()
    })
  })
})
