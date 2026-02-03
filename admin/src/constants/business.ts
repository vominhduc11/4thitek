/**
 * Business Constants
 * Chứa các hằng số liên quan đến nghiệp vụ kinh doanh
 */

/**
 * Thuế VAT (10%)
 */
export const VAT_RATE = 0.1;

/**
 * Số items mặc định trên mỗi trang
 */
export const DEFAULT_ITEMS_PER_PAGE = 10;

/**
 * Các trạng thái thanh toán
 */
export const PAYMENT_STATUS = {
  PAID: 'PAID' as const,
  UNPAID: 'UNPAID' as const,
};

/**
 * Các trạng thái order item
 */
export const ORDER_ITEM_STATUS = {
  PENDING: 'PENDING' as const,
  ASSIGNED: 'ASSIGNED' as const,
  PARTIAL: 'PARTIAL' as const,
  COMPLETED: 'COMPLETED' as const,
};
