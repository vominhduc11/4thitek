/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  createAdminBlog,
  createAdminDealerAccount,
  createAdminDiscountRule,
  createAdminUser,
  deleteAdminBlog,
  deleteAdminOrder,
  fetchAdminDealerAccounts,
  fetchAdminSettings,
  fetchAdminBlogs,
  fetchAdminDiscountRules,
  fetchAdminOrders,
  fetchAdminUsers,
  updateAdminBlog,
  updateAdminDealerAccountStatus,
  updateAdminDiscountRuleStatus,
  updateAdminSettings,
  updateAdminOrderStatus,
  updateAdminUserStatus,
} from '../lib/adminApi'
import {
  mapBackendSettings,
  mapBlog,
  mapDealer,
  mapDiscountRule,
  mapOrder,
  mapUser,
  toBackendDealerAccountStatus,
  toBackendDealerAccountTier,
  toBackendOrderStatus,
  toBackendRuleStatus,
  toBackendUserStatus,
  toBlogUpsertRequest,
} from '../lib/adminDataMappers'
import {
  initialSettings,
  type AppSettings,
  type BlogPost,
  type BlogStatus,
  type Dealer,
  type DealerStatus,
  type DiscountRule,
  type Order,
  type OrderStatus,
  type RuleStatus,
  type StaffUser,
  type UserStatus,
} from './adminDataTypes'

export type {
  AppSettings,
  BlogPost,
  BlogStatus,
  Dealer,
  DealerStatus,
  DealerTier,
  DiscountRule,
  Order,
  OrderStatus,
  RuleStatus,
  StaffUser,
  UserStatus,
} from './adminDataTypes'

type AdminDataContextValue = {
  orders: Order[]
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  posts: BlogPost[]
  addPost: (
    payload: Pick<BlogPost, 'title' | 'category' | 'excerpt' | 'status' | 'imageUrl'>,
  ) => Promise<BlogPost>
  updatePostStatus: (id: string, status: BlogStatus) => Promise<void>
  deletePost: (id: string) => Promise<void>
  dealers: Dealer[]
  addDealer: (
    payload: Pick<Dealer, 'name' | 'tier' | 'email' | 'phone'> &
      Partial<Pick<Dealer, 'revenue' | 'orders'>>,
  ) => Promise<Dealer>
  updateDealerStatus: (id: string, status: DealerStatus) => Promise<void>
  users: StaffUser[]
  addUser: (payload: Pick<StaffUser, 'name' | 'role'>) => Promise<StaffUser>
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>
  discountRules: DiscountRule[]
  addDiscountRule: (
    payload: Pick<DiscountRule, 'label' | 'range' | 'percent' | 'status'>,
  ) => Promise<DiscountRule>
  updateDiscountRuleStatus: (id: string, status: RuleStatus) => Promise<void>
  settings: AppSettings
  isSettingsLoading: boolean
  isSettingsSaving: boolean
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [users, setUsers] = useState<StaffUser[]>([])
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([])
  const [settings, setSettings] = useState<AppSettings>(initialSettings)
  const [isSettingsLoading, setIsSettingsLoading] = useState(false)
  const [isSettingsSaving, setIsSettingsSaving] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      const timer = window.setTimeout(() => {
        setOrders([])
        setPosts([])
        setDealers([])
        setUsers([])
        setDiscountRules([])
        setSettings(initialSettings)
        setIsSettingsLoading(false)
        setIsSettingsSaving(false)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    let cancelled = false

    const loadAll = async () => {
      setIsSettingsLoading(true)
      try {
        const [orderData, blogData, dealerData, userData, discountData, settingsData] = await Promise.all([
          fetchAdminOrders(accessToken),
          fetchAdminBlogs(accessToken),
          fetchAdminDealerAccounts(accessToken),
          fetchAdminUsers(accessToken),
          fetchAdminDiscountRules(accessToken),
          fetchAdminSettings(accessToken),
        ])

        if (cancelled) return

        setOrders(orderData.map(mapOrder))
        setPosts(blogData.filter((item) => !item.isDeleted).map(mapBlog))
        setDealers(dealerData.map(mapDealer))
        setUsers(userData.map(mapUser))
        setDiscountRules(discountData.map(mapDiscountRule))
        setSettings(mapBackendSettings(settingsData))
      } catch (error) {
        if (!cancelled) {
          notify(error instanceof Error ? error.message : 'Không tải được dữ liệu admin', {
            title: 'Admin',
            variant: 'error',
          })
        }
      } finally {
        if (!cancelled) {
          setIsSettingsLoading(false)
        }
      }
    }

    void loadAll()

    return () => {
      cancelled = true
    }
  }, [accessToken, notify])

  const requireToken = () => {
    if (!accessToken) {
      throw new Error('Admin session is not available')
    }
    return accessToken
  }

  const updateOrderStatus: AdminDataContextValue['updateOrderStatus'] = async (id, status) => {
    const token = requireToken()
    const updated = await updateAdminOrderStatus(token, Number(id), toBackendOrderStatus(status))
    setOrders((prev) => prev.map((item) => (item.id === id ? mapOrder(updated) : item)))
  }

  const deleteOrder: AdminDataContextValue['deleteOrder'] = async (id) => {
    const token = requireToken()
    await deleteAdminOrder(token, Number(id))
    setOrders((prev) => prev.filter((item) => item.id !== id))
  }

  const addPost: AdminDataContextValue['addPost'] = async (payload) => {
    const token = requireToken()
    const created = await createAdminBlog(
      token,
      toBlogUpsertRequest({
        category: payload.category,
        title: payload.title,
        excerpt: payload.excerpt,
        imageUrl: payload.imageUrl,
        status: payload.status,
      }),
    )
    const nextPost = mapBlog(created)
    setPosts((prev) => [nextPost, ...prev])
    return nextPost
  }

  const updatePostStatus: AdminDataContextValue['updatePostStatus'] = async (id, status) => {
    const token = requireToken()
    const current = posts.find((item) => item.id === id)
    if (!current) return

    const updated = await updateAdminBlog(
      token,
      Number(id),
      toBlogUpsertRequest({
        status,
        showOnHomepage: status === 'published' ? current.showOnHomepage : false,
      }),
    )
    const nextPost = mapBlog(updated)
    setPosts((prev) => prev.map((item) => (item.id === id ? nextPost : item)))
  }

  const deletePost: AdminDataContextValue['deletePost'] = async (id) => {
    const token = requireToken()
    await deleteAdminBlog(token, Number(id))
    setPosts((prev) => prev.filter((item) => item.id !== id))
  }

  const addDealer: AdminDataContextValue['addDealer'] = async (payload) => {
    const token = requireToken()
    const created = await createAdminDealerAccount(token, {
      name: payload.name.trim(),
      tier: toBackendDealerAccountTier(payload.tier),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      revenue: payload.revenue,
      status: 'ACTIVE',
    })
    const nextDealer = mapDealer(created)
    setDealers((prev) => [nextDealer, ...prev])
    return nextDealer
  }

  const updateDealerStatus: AdminDataContextValue['updateDealerStatus'] = async (id, status) => {
    const token = requireToken()
    const updated = await updateAdminDealerAccountStatus(
      token,
      Number(id),
      toBackendDealerAccountStatus(status),
    )
    setDealers((prev) => prev.map((item) => (item.id === id ? mapDealer(updated) : item)))
  }

  const addUser: AdminDataContextValue['addUser'] = async (payload) => {
    const token = requireToken()
    const created = await createAdminUser(token, {
      name: payload.name.trim(),
      role: payload.role.trim(),
      status: 'PENDING',
    })
    const nextUser = mapUser(created)
    setUsers((prev) => [nextUser, ...prev])
    return nextUser
  }

  const updateUserStatus: AdminDataContextValue['updateUserStatus'] = async (id, status) => {
    const token = requireToken()
    const updated = await updateAdminUserStatus(token, Number(id), toBackendUserStatus(status))
    setUsers((prev) => prev.map((item) => (item.id === id ? mapUser(updated) : item)))
  }

  const addDiscountRule: AdminDataContextValue['addDiscountRule'] = async (payload) => {
    const token = requireToken()
    const created = await createAdminDiscountRule(token, {
      label: payload.label.trim(),
      range: payload.range.trim(),
      percent: payload.percent,
      status: toBackendRuleStatus(payload.status),
    })
    const nextRule = mapDiscountRule(created)
    setDiscountRules((prev) => [nextRule, ...prev])
    return nextRule
  }

  const updateDiscountRuleStatus: AdminDataContextValue['updateDiscountRuleStatus'] = async (
    id,
    status,
  ) => {
    const token = requireToken()
    const updated = await updateAdminDiscountRuleStatus(token, Number(id), toBackendRuleStatus(status))
    setDiscountRules((prev) => prev.map((item) => (item.id === id ? mapDiscountRule(updated) : item)))
  }

  const updateSettings: AdminDataContextValue['updateSettings'] = async (patch) => {
    const token = requireToken()
    setIsSettingsSaving(true)
    try {
      const updated = await updateAdminSettings(token, patch)
      setSettings(mapBackendSettings(updated))
    } finally {
      setIsSettingsSaving(false)
    }
  }

  const value: AdminDataContextValue = {
    orders,
    updateOrderStatus,
    deleteOrder,
    posts,
    addPost,
    updatePostStatus,
    deletePost,
    dealers,
    addDealer,
    updateDealerStatus,
    users,
    addUser,
    updateUserStatus,
    discountRules,
    addDiscountRule,
    updateDiscountRuleStatus,
    settings,
    isSettingsLoading,
    isSettingsSaving,
    updateSettings,
  }

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider')
  }
  return context
}
