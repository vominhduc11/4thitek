import { DISCOUNT_RULES } from '../data/discounts'
import type { DiscountContext, DiscountResult } from '../types'

export const calculateDiscount = (context: DiscountContext): DiscountResult => {
  if (context.subtotal <= 0) {
    return {
      label: 'Chưa đạt điều kiện',
      percent: 0,
      amount: 0,
    }
  }

  const eligibleRules = DISCOUNT_RULES.filter((rule) => rule.isEligible(context))

  if (eligibleRules.length === 0) {
    return {
      label: 'Chưa đạt điều kiện',
      percent: 0,
      amount: 0,
    }
  }

  const bestRule = eligibleRules.reduce((best, rule) =>
    rule.percent > best.percent ? rule : best,
  )

  const amount = Math.round(context.subtotal * (bestRule.percent / 100))

  return {
    ruleId: bestRule.id,
    label: bestRule.label,
    percent: bestRule.percent,
    amount,
  }
}