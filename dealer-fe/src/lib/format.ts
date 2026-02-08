const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)
