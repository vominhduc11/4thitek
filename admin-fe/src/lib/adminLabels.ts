import type {
  BlogStatus,
  DealerStatus,
  DealerTier,
  OrderStatus,
  RuleStatus,
  UserStatus,
} from '../context/AdminDataContext'
import type { BadgeTone } from '../components/ui-kit'

export const orderStatusLabel: Record<OrderStatus, string> = {
  packing: 'Dong goi',
  pending: 'Cho xu ly',
  delivering: 'Dang giao',
  completed: 'Hoan tat',
  cancelled: 'Huy',
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
  published: 'Da dang',
  scheduled: 'Hen gio',
  draft: 'Ban nhap',
}

export const blogStatusTone: Record<BlogStatus, BadgeTone> = {
  published: 'success',
  scheduled: 'info',
  draft: 'warning',
}

export const dealerTierLabel: Record<DealerTier, string> = {
  platinum: 'Bach kim',
  gold: 'Vang',
  silver: 'Bac',
  bronze: 'Dong',
}

export const dealerTierTone: Record<DealerTier, BadgeTone> = {
  platinum: 'info',
  gold: 'warning',
  silver: 'neutral',
  bronze: 'danger',
}

export const dealerStatusLabel: Record<DealerStatus, string> = {
  active: 'Da kich hoat',
  under_review: 'Cho duyet ho so',
  needs_attention: 'Can bo sung ho so',
}

export const dealerStatusTone: Record<DealerStatus, BadgeTone> = {
  active: 'success',
  under_review: 'info',
  needs_attention: 'warning',
}

export const dealerStatusDescription: Record<DealerStatus, string> = {
  active: 'Dai ly da duoc phe duyet va co the dang nhap ung dung dealer.',
  under_review: 'Ho so dang cho admin xac minh. Dai ly chua the dang nhap dealer app.',
  needs_attention: 'Ho so can bo sung them thong tin truoc khi kich hoat tai khoan.',
}

export const userStatusLabel: Record<UserStatus, string> = {
  active: 'Dang hoat dong',
  pending: 'Cho duyet',
}

export const userStatusTone: Record<UserStatus, BadgeTone> = {
  active: 'success',
  pending: 'info',
}

export const ruleStatusLabel: Record<RuleStatus, string> = {
  active: 'Dang hoat dong',
  pending: 'Cho duyet',
  draft: 'Ban nhap',
}

export const ruleStatusTone: Record<RuleStatus, BadgeTone> = {
  active: 'success',
  pending: 'warning',
  draft: 'neutral',
}
