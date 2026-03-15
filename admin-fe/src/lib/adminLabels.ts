import type {
  BlogStatus,
  DealerStatus,
  OrderStatus,
  RuleStatus,
  UserStatus,
} from '../context/AdminDataContext'
import type { BadgeTone } from '../components/ui-kit'

export const orderStatusLabel: Record<OrderStatus, string> = {
  packing: 'Đóng gói',
  pending: 'Chờ xử lý',
  delivering: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Hủy',
}

export const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  packing: 'info',
  pending: 'warning',
  delivering: 'success',
  completed: 'success',
  cancelled: 'danger',
}

export const getAllowedOrderStatuses = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case 'pending':
      return ['pending', 'packing', 'cancelled']
    case 'packing':
      return ['packing', 'delivering', 'cancelled']
    case 'delivering':
      return ['delivering', 'completed']
    case 'completed':
      return ['completed']
    case 'cancelled':
      return ['cancelled']
    default:
      return [current]
  }
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

export const dealerStatusDescription: Record<DealerStatus, string> = {
  active: 'Đại lý đã được phê duyệt và có thể đăng nhập ứng dụng dealer.',
  under_review: 'Hồ sơ đang chờ admin xác minh trước khi kích hoạt.',
  suspended: 'Tài khoản đại lý đã bị tạm khóa, không thể đăng nhập ứng dụng dealer.',
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
  pending: 'Chờ duyệt',
  draft: 'Bản nháp',
}

export const ruleStatusTone: Record<RuleStatus, BadgeTone> = {
  active: 'success',
  pending: 'warning',
  draft: 'neutral',
}
