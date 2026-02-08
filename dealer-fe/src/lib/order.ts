export const buildOrderId = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `DH-${stamp}-${random}`
}
