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
