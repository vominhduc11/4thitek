/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  createAdminBlog,
  createAdminDealerAccount,
  createAdminDiscountRule,
  createAdminUser,
  deleteAdminBlog,
  deleteAdminOrder,
  fetchAdminBlogs,
  fetchAdminDealerAccounts,
  fetchAdminDiscountRules,
  fetchAdminOrders,
  fetchAdminSettings,
  fetchAdminUsers,
  recordAdminOrderPayment,
  updateAdminBlog,
  updateAdminDealerAccount,
  updateAdminDealerAccountStatus,
  updateAdminDiscountRuleStatus,
  updateAdminOrderStatus,
  updateAdminSettings,
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
  toBackendPaymentMethod,
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

export type AdminResourceKey =
  | 'orders'
  | 'posts'
  | 'dealers'
  | 'users'
  | 'discountRules'
  | 'settings'

export type AdminResourceState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  lastLoadedAt: number | null
}

type AdminDataContextValue = {
  orders: Order[]
  ordersState: AdminResourceState
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
  recordOrderPayment: (
    id: string,
    payload: {
      amount: number
      method?: 'bank_transfer' | 'debt'
      channel?: string
      transactionCode?: string
      note?: string
      paidAt?: string
    },
  ) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  posts: BlogPost[]
  postsState: AdminResourceState
  addPost: (
    payload: Pick<BlogPost, 'title' | 'category' | 'excerpt' | 'status' | 'imageUrl'>,
  ) => Promise<BlogPost>
  updatePostStatus: (id: string, status: BlogStatus) => Promise<void>
  deletePost: (id: string) => Promise<void>
  dealers: Dealer[]
  dealersState: AdminResourceState
  addDealer: (
    payload: Pick<Dealer, 'name' | 'tier' | 'email' | 'phone'> &
      Partial<Pick<Dealer, 'revenue' | 'orders' | 'creditLimit'>>,
  ) => Promise<Dealer>
  updateDealer: (
    id: string,
    payload: Pick<Dealer, 'name' | 'tier' | 'email' | 'phone' | 'creditLimit'>,
  ) => Promise<void>
  updateDealerStatus: (id: string, status: DealerStatus) => Promise<void>
  users: StaffUser[]
  usersState: AdminResourceState
  addUser: (payload: Pick<StaffUser, 'name' | 'role'>) => Promise<StaffUser>
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>
  discountRules: DiscountRule[]
  discountRulesState: AdminResourceState
  addDiscountRule: (
    payload: Pick<DiscountRule, 'label' | 'range' | 'percent' | 'status'>,
  ) => Promise<DiscountRule>
  updateDiscountRuleStatus: (id: string, status: RuleStatus) => Promise<void>
  settings: AppSettings
  settingsState: AdminResourceState
  isSettingsLoading: boolean
  isSettingsSaving: boolean
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  reloadResource: (resource: AdminResourceKey) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

const createInitialResourceState = (): Record<AdminResourceKey, AdminResourceState> => ({
  orders: { status: 'idle', error: null, lastLoadedAt: null },
  posts: { status: 'idle', error: null, lastLoadedAt: null },
  dealers: { status: 'idle', error: null, lastLoadedAt: null },
  users: { status: 'idle', error: null, lastLoadedAt: null },
  discountRules: { status: 'idle', error: null, lastLoadedAt: null },
  settings: { status: 'idle', error: null, lastLoadedAt: null },
})

const resourceQueryKeys: Record<AdminResourceKey, readonly string[]> = {
  orders: ['admin', 'orders'],
  posts: ['admin', 'posts'],
  dealers: ['admin', 'dealers'],
  users: ['admin', 'users'],
  discountRules: ['admin', 'discountRules'],
  settings: ['admin', 'settings'],
}

export const getRequiredResources = (
  pathname: string,
  canManageUsers: boolean,
): AdminResourceKey[] => {
  if (pathname === '/' || pathname.startsWith('/products')) {
    return []
  }
  if (pathname.startsWith('/orders')) {
    return ['orders']
  }
  if (pathname.startsWith('/blogs')) {
    return ['posts']
  }
  if (pathname.startsWith('/dealers') || pathname.startsWith('/customers')) {
    return ['dealers']
  }
  if (pathname.startsWith('/users')) {
    return canManageUsers ? ['users'] : []
  }
  if (pathname.startsWith('/discounts')) {
    return ['discountRules']
  }
  if (pathname.startsWith('/settings')) {
    return ['settings']
  }
  return []
}

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const { accessToken, hasRole } = useAuth()
  const { notify } = useToast()
  const location = useLocation()
  const canManageUsers = hasRole('SUPER_ADMIN')
  const [orders, setOrders] = useState<Order[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [users, setUsers] = useState<StaffUser[]>([])
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([])
  const [settings, setSettings] = useState<AppSettings>(initialSettings)
  const [resourceStates, setResourceStates] = useState<Record<AdminResourceKey, AdminResourceState>>(
    createInitialResourceState,
  )
  const [isSettingsSaving, setIsSettingsSaving] = useState(false)
  const resourceStatesRef = useRef(resourceStates)
  const requestVersionRef = useRef(0)

  useEffect(() => {
    resourceStatesRef.current = resourceStates
  }, [resourceStates])

  useEffect(() => {
    requestVersionRef.current += 1
  }, [accessToken])

  const setResourceState = useCallback(
    (resource: AdminResourceKey, patch: Partial<AdminResourceState>) => {
      setResourceStates((previous) => ({
        ...previous,
        [resource]: {
          ...previous[resource],
          ...patch,
        },
      }))
    },
    [],
  )

  useEffect(() => {
    if (accessToken) {
      return
    }

    const timer = window.setTimeout(() => {
      setOrders([])
      setPosts([])
      setDealers([])
      setUsers([])
      setDiscountRules([])
      setSettings(initialSettings)
      setIsSettingsSaving(false)
      setResourceStates(createInitialResourceState())
    }, 0)

    return () => window.clearTimeout(timer)
  }, [accessToken])

  const requireToken = () => {
    if (!accessToken) {
      throw new Error('Admin session is not available')
    }

    return accessToken
  }

  const loadResource = useCallback(
    async (resource: AdminResourceKey, options?: { force?: boolean; notifyOnError?: boolean }) => {
      const token = accessToken
      if (!token) {
        return
      }

      if (resource === 'users' && !canManageUsers) {
        setUsers([])
        setResourceState('users', {
          status: 'success',
          error: null,
          lastLoadedAt: Date.now(),
        })
        return
      }

      const currentState = resourceStatesRef.current[resource]
      if (!options?.force && (currentState.status === 'loading' || currentState.status === 'success')) {
        return
      }

      const requestVersion = requestVersionRef.current
      setResourceState(resource, { status: 'loading', error: null })

      try {
        if (options?.force) {
          await queryClient.invalidateQueries({ queryKey: resourceQueryKeys[resource] })
        }

        if (resource === 'orders') {
          const orderData = await queryClient.fetchQuery({
            queryKey: [...resourceQueryKeys.orders, token],
            queryFn: async () => {
              const response = await fetchAdminOrders(token)
              return response.map(mapOrder)
            },
          })
          if (requestVersionRef.current !== requestVersion) {
            return
          }
          setOrders(orderData)
        } else if (resource === 'posts') {
          const blogData = await queryClient.fetchQuery({
            queryKey: [...resourceQueryKeys.posts, token],
            queryFn: async () => {
              const response = await fetchAdminBlogs(token)
              return response.filter((item) => !item.isDeleted).map(mapBlog)
            },
          })
          if (requestVersionRef.current !== requestVersion) {
            return
          }
          setPosts(blogData)
        } else if (resource === 'dealers') {
          const dealerData = await queryClient.fetchQuery({
            queryKey: [...resourceQueryKeys.dealers, token],
            queryFn: async () => {
              const response = await fetchAdminDealerAccounts(token)
              return response.map(mapDealer)
            },
          })
          if (requestVersionRef.current !== requestVersion) {
            return
          }
          setDealers(dealerData)
        } else if (resource === 'users') {
          const userData = await queryClient.fetchQuery({
            queryKey: [...resourceQueryKeys.users, token],
            queryFn: async () => {
              const response = await fetchAdminUsers(token)
              return response.map(mapUser)
            },
          })
          if (requestVersionRef.current !== requestVersion) {
            return
          }
          setUsers(userData)
        } else if (resource === 'discountRules') {
          const discountData = await queryClient.fetchQuery({
            queryKey: [...resourceQueryKeys.discountRules, token],
            queryFn: async () => {
              const response = await fetchAdminDiscountRules(token)
              return response.map(mapDiscountRule)
            },
          })
          if (requestVersionRef.current !== requestVersion) {
            return
          }
          setDiscountRules(discountData)
        } else if (resource === 'settings') {
          const settingsData = await queryClient.fetchQuery({
            queryKey: [...resourceQueryKeys.settings, token],
            queryFn: async () => mapBackendSettings(await fetchAdminSettings(token)),
          })
          if (requestVersionRef.current !== requestVersion) {
            return
          }
          setSettings(settingsData)
        }

        setResourceState(resource, {
          status: 'success',
          error: null,
          lastLoadedAt: Date.now(),
        })
      } catch (error) {
        if (requestVersionRef.current !== requestVersion) {
          return
        }

        const message = error instanceof Error ? error.message : 'Khong tai duoc du lieu admin'
        setResourceState(resource, {
          status: 'error',
          error: message,
        })

        if (options?.notifyOnError !== false) {
          notify(message, {
            title: 'Admin',
            variant: 'error',
          })
        }
      }
    },
    [accessToken, canManageUsers, notify, queryClient, setResourceState],
  )

  const requiredResources = useMemo(
    () => getRequiredResources(location.pathname, canManageUsers),
    [canManageUsers, location.pathname],
  )

  useEffect(() => {
    if (!accessToken) {
      return
    }

    requiredResources.forEach((resource) => {
      void loadResource(resource, {
        notifyOnError: resourceStatesRef.current[resource].status !== 'error',
      })
    })
  }, [accessToken, loadResource, requiredResources])

  const reloadResource: AdminDataContextValue['reloadResource'] = useCallback(
    async (resource) => {
      await loadResource(resource, { force: true, notifyOnError: true })
    },
    [loadResource],
  )

  const updateOrderStatus: AdminDataContextValue['updateOrderStatus'] = async (id, status) => {
    const token = requireToken()
    const updated = await updateAdminOrderStatus(token, Number(id), toBackendOrderStatus(status))
    setOrders((previous) => previous.map((item) => (item.id === id ? mapOrder(updated) : item)))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.orders })
  }

  const recordOrderPayment: AdminDataContextValue['recordOrderPayment'] = async (id, payload) => {
    const token = requireToken()
    const updated = await recordAdminOrderPayment(token, Number(id), {
      amount: payload.amount,
      method: payload.method ? toBackendPaymentMethod(payload.method) : undefined,
      channel: payload.channel,
      transactionCode: payload.transactionCode,
      note: payload.note,
      paidAt: payload.paidAt,
    })
    setOrders((previous) => previous.map((item) => (item.id === id ? mapOrder(updated) : item)))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.orders })
  }

  const deleteOrder: AdminDataContextValue['deleteOrder'] = async (id) => {
    const token = requireToken()
    await deleteAdminOrder(token, Number(id))
    setOrders((previous) => previous.filter((item) => item.id !== id))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.orders })
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
    setPosts((previous) => [nextPost, ...previous])
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.posts })
    return nextPost
  }

  const updatePostStatus: AdminDataContextValue['updatePostStatus'] = async (id, status) => {
    const token = requireToken()
    const current = posts.find((item) => item.id === id)
    if (!current) {
      return
    }

    const updated = await updateAdminBlog(
      token,
      Number(id),
      toBlogUpsertRequest({
        status,
        showOnHomepage: status === 'published' ? current.showOnHomepage : false,
      }),
    )
    const nextPost = mapBlog(updated)
    setPosts((previous) => previous.map((item) => (item.id === id ? nextPost : item)))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.posts })
  }

  const deletePost: AdminDataContextValue['deletePost'] = async (id) => {
    const token = requireToken()
    await deleteAdminBlog(token, Number(id))
    setPosts((previous) => previous.filter((item) => item.id !== id))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.posts })
  }

  const addDealer: AdminDataContextValue['addDealer'] = async (payload) => {
    const token = requireToken()
    const created = await createAdminDealerAccount(token, {
      name: payload.name.trim(),
      tier: toBackendDealerAccountTier(payload.tier),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      revenue: payload.revenue,
      creditLimit: payload.creditLimit,
      status: 'ACTIVE',
    })
    const nextDealer = mapDealer(created)
    setDealers((previous) => [nextDealer, ...previous])
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.dealers })
    return nextDealer
  }

  const updateDealerStatus: AdminDataContextValue['updateDealerStatus'] = async (id, status) => {
    const token = requireToken()
    const updated = await updateAdminDealerAccountStatus(
      token,
      Number(id),
      toBackendDealerAccountStatus(status),
    )
    setDealers((previous) => previous.map((item) => (item.id === id ? mapDealer(updated) : item)))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.dealers })
  }

  const updateDealer: AdminDataContextValue['updateDealer'] = async (id, payload) => {
    const token = requireToken()
    const current = dealers.find((item) => item.id === id)
    if (!current) {
      return
    }

    const updated = await updateAdminDealerAccount(token, Number(id), {
      name: payload.name.trim(),
      tier: toBackendDealerAccountTier(payload.tier),
      status: toBackendDealerAccountStatus(current.status),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      creditLimit: payload.creditLimit,
    })
    setDealers((previous) => previous.map((item) => (item.id === id ? mapDealer(updated) : item)))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.dealers })
  }

  const addUser: AdminDataContextValue['addUser'] = async (payload) => {
    const token = requireToken()
    const created = await createAdminUser(token, {
      name: payload.name.trim(),
      role: payload.role.trim(),
      status: 'PENDING',
    })
    const nextUser = mapUser(created)
    setUsers((previous) => [nextUser, ...previous])
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.users })
    return nextUser
  }

  const updateUserStatus: AdminDataContextValue['updateUserStatus'] = async (id, status) => {
    const token = requireToken()
    const updated = await updateAdminUserStatus(token, Number(id), toBackendUserStatus(status))
    setUsers((previous) => previous.map((item) => (item.id === id ? mapUser(updated) : item)))
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.users })
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
    setDiscountRules((previous) => [nextRule, ...previous])
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.discountRules })
    return nextRule
  }

  const updateDiscountRuleStatus: AdminDataContextValue['updateDiscountRuleStatus'] = async (
    id,
    status,
  ) => {
    const token = requireToken()
    const updated = await updateAdminDiscountRuleStatus(token, Number(id), toBackendRuleStatus(status))
    setDiscountRules((previous) =>
      previous.map((item) => (item.id === id ? mapDiscountRule(updated) : item)),
    )
    await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.discountRules })
  }

  const updateSettings: AdminDataContextValue['updateSettings'] = async (patch) => {
    const token = requireToken()
    setIsSettingsSaving(true)
    try {
      const updated = await updateAdminSettings(token, patch)
      setSettings(mapBackendSettings(updated))
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.settings })
      setResourceState('settings', {
        status: 'success',
        error: null,
        lastLoadedAt: Date.now(),
      })
    } finally {
      setIsSettingsSaving(false)
    }
  }

  const value: AdminDataContextValue = {
    orders,
    ordersState: resourceStates.orders,
    updateOrderStatus,
    recordOrderPayment,
    deleteOrder,
    posts,
    postsState: resourceStates.posts,
    addPost,
    updatePostStatus,
    deletePost,
    dealers,
    dealersState: resourceStates.dealers,
    addDealer,
    updateDealer,
    updateDealerStatus,
    users,
    usersState: resourceStates.users,
    addUser,
    updateUserStatus,
    discountRules,
    discountRulesState: resourceStates.discountRules,
    addDiscountRule,
    updateDiscountRuleStatus,
    settings,
    settingsState: resourceStates.settings,
    isSettingsLoading: resourceStates.settings.status === 'loading',
    isSettingsSaving,
    updateSettings,
    reloadResource,
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
