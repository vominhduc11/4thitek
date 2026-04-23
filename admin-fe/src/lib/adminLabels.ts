import type {
  BlogStatus,
  DealerStatus,
  OrderStatus,
  RuleStatus,
  UserStatus,
} from '../context/AdminDataContext'
import type { BadgeTone } from '../components/ui-kit'

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Hủy',
}

export const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  confirmed: 'info',
  shipping: 'success',
  completed: 'success',
  cancelled: 'danger',
}

export const getAllowedOrderStatuses = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case 'pending':
      return ['pending', 'confirmed', 'cancelled']
    case 'confirmed':
      return ['confirmed', 'shipping', 'cancelled']
    case 'shipping':
      return ['shipping', 'completed']
    case 'completed':
      return ['completed']
    case 'cancelled':
      return ['cancelled']
    default:
      return [current]
  }
}

export const resolveAllowedOrderStatuses = (
  current: OrderStatus,
  allowedTransitions?: OrderStatus[],
): OrderStatus[] => {
  if (allowedTransitions && allowedTransitions.length > 0) {
    return allowedTransitions
  }
  return getAllowedOrderStatuses(current)
}

export const blogStatusLabel: Record<BlogStatus, string> = {
  published: 'Đã đăng',
  scheduled: 'Hẹn giờ',
  draft: 'Bản nháp',
}

export const blogStatusTone: Record<BlogStatus, BadgeTone> = {
  published: 'success',
  scheduled: 'info',
  draft: 'warning',
}

export const dealerStatusLabel: Record<DealerStatus, string> = {
  active: 'Đã kích hoạt',
  under_review: 'Chờ duyệt hồ sơ',
  suspended: 'Tạm khóa',
}

export const dealerStatusTone: Record<DealerStatus, BadgeTone> = {
  active: 'success',
  under_review: 'info',
  suspended: 'danger',
}

export const getAllowedDealerStatuses = (current: DealerStatus): DealerStatus[] => {
  switch (current) {
    case 'under_review':
      return ['under_review', 'active', 'suspended']
    case 'active':
      return ['active', 'suspended']
    case 'suspended':
      return ['suspended', 'active']
    default:
      return [current]
  }
}

export const resolveAllowedDealerStatuses = (
  current: DealerStatus,
  allowedTransitions?: DealerStatus[],
): DealerStatus[] => {
  if (allowedTransitions && allowedTransitions.length > 0) {
    return allowedTransitions
  }
  return getAllowedDealerStatuses(current)
}

export const dealerStatusDescription: Record<DealerStatus, string> = {
  active: 'Đại lý đã được phê duyệt và có thể đăng nhập ứng dụng đại lý.',
  under_review: 'Hồ sơ đang chờ xác minh trước khi kích hoạt.',
  suspended: 'Tài khoản đại lý đã bị tạm khóa, không thể đăng nhập ứng dụng đại lý.',
}

export const userStatusLabel: Record<UserStatus, string> = {
  active: 'Đang hoạt động',
  pending: 'Chờ duyệt',
}

export const userStatusTone: Record<UserStatus, BadgeTone> = {
  active: 'success',
  pending: 'info',
}

export const ruleStatusLabel: Record<RuleStatus, string> = {
  active: 'Đang hoạt động',
  draft: 'Bản nháp',
}

export const ruleStatusTone: Record<RuleStatus, BadgeTone> = {
  active: 'success',
  draft: 'neutral',
}

export const returnRequestStatusLabel: Record<string, string> = {
  SUBMITTED: 'Đã gửi yêu cầu',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  AWAITING_RECEIPT: 'Chờ nhận hàng',
  RECEIVED: 'Đã nhận hàng',
  INSPECTING: 'Đang kiểm tra',
  PARTIALLY_RESOLVED: 'Giải quyết một phần',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export const returnRequestItemStatusLabel: Record<string, string> = {
  REQUESTED: 'Đã yêu cầu',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  RECEIVED: 'Đã nhận',
  INSPECTING: 'Đang kiểm tra',
  QC_PASSED: 'Đạt kiểm tra',
  QC_FAILED: 'Không đạt kiểm tra',
  RESTOCKED: 'Đã nhập kho lại',
  SCRAPPED: 'Đã hủy hàng',
  REPLACED: 'Đã thay thế',
  CREDITED: 'Đã ghi có',
  REPAIRED: 'Đã sửa chữa',
  RETURNED_TO_CUSTOMER: 'Đã trả khách',
  WARRANTY_REJECTED: 'Từ chối bảo hành',
}

export const returnRequestTypeLabel: Record<string, string> = {
  COMMERCIAL_RETURN: 'Đổi trả thương mại',
  DEFECTIVE_RETURN: 'Trả hàng lỗi',
  WARRANTY_RMA: 'Bảo hành RMA',
}

export const returnRequestResolutionLabel: Record<string, string> = {
  REFUND: 'Hoàn tiền',
  REPLACEMENT: 'Thay thế',
  CREDIT: 'Ghi có',
  RESTOCK: 'Nhập kho lại',
  SCRAP: 'Hủy hàng',
  REPAIR: 'Sửa chữa',
  REPLACE: 'Thay thế',
  CREDIT_NOTE: 'Phiếu ghi có',
  RETURN_TO_CUSTOMER: 'Trả lại khách',
  REJECT_WARRANTY: 'Từ chối bảo hành',
}
