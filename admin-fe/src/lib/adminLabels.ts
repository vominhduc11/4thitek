import type {
  BlogStatus,
  CustomerStatus,
  CustomerTier,
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

export const customerTierLabel: Record<CustomerTier, string> = {
  platinum: 'Bach kim',
  gold: 'Vang',
  silver: 'Bac',
  bronze: 'Dong',
}

export const customerTierTone: Record<CustomerTier, BadgeTone> = {
  platinum: 'info',
  gold: 'warning',
  silver: 'neutral',
  bronze: 'danger',
}

export const customerStatusLabel: Record<CustomerStatus, string> = {
  active: 'Dang hoat dong',
  under_review: 'Dang xem xet',
  needs_attention: 'Can cham soc',
}

export const customerStatusTone: Record<CustomerStatus, BadgeTone> = {
  active: 'success',
  under_review: 'info',
  needs_attention: 'warning',
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
