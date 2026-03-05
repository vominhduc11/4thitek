/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'

export type OrderStatus = 'packing' | 'pending' | 'delivering' | 'completed' | 'cancelled'
export type BlogStatus = 'published' | 'scheduled' | 'draft'
export type CustomerTier = 'platinum' | 'gold' | 'silver' | 'bronze'
export type CustomerStatus = 'active' | 'under_review' | 'needs_attention'
export type UserStatus = 'active' | 'pending'
export type RuleStatus = 'active' | 'pending' | 'draft'

export type Order = {
  id: string
  customer: string
  total: number
  status: OrderStatus
  items: number
  address: string
  note: string
  createdAt: string
}

export type BlogPost = {
  id: string
  title: string
  category: string
  status: BlogStatus
  updatedAt: string
  views: number
  author: string
  excerpt: string
}

export type Customer = {
  id: string
  name: string
  tier: CustomerTier
  status: CustomerStatus
  orders: number
  lastOrderAt: string
  revenue: number
  email: string
  phone: string
}

export type StaffUser = {
  id: string
  name: string
  role: string
  status: UserStatus
}

export type DiscountRule = {
  id: string
  label: string
  range: string
  percent: number
  status: RuleStatus
  updatedAt: string
}

export type AppSettings = {
  emailConfirmation: boolean
  sessionTimeoutMinutes: number
  orderAlerts: boolean
  inventoryAlerts: boolean
}

type AdminDataContextValue = {
  orders: Order[]
  addOrder: (payload: Pick<Order, 'customer' | 'total' | 'items' | 'address' | 'note'>) => Order
  updateOrderStatus: (id: string, status: OrderStatus) => void
  deleteOrder: (id: string) => void
  posts: BlogPost[]
  addPost: (
    payload: Pick<BlogPost, 'title' | 'category' | 'author' | 'excerpt' | 'status'>,
  ) => BlogPost
  updatePostStatus: (id: string, status: BlogStatus) => void
  deletePost: (id: string) => void
  customers: Customer[]
  addCustomer: (
    payload: Pick<Customer, 'name' | 'tier' | 'email' | 'phone'> &
      Partial<Pick<Customer, 'revenue' | 'orders'>>,
  ) => Customer
  updateCustomerStatus: (id: string, status: CustomerStatus) => void
  users: StaffUser[]
  addUser: (payload: Pick<StaffUser, 'name' | 'role'>) => StaffUser
  updateUserStatus: (id: string, status: UserStatus) => void
  discountRules: DiscountRule[]
  addDiscountRule: (
    payload: Pick<DiscountRule, 'label' | 'range' | 'percent' | 'status'>,
  ) => DiscountRule
  updateDiscountRuleStatus: (id: string, status: RuleStatus) => void
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

const nowIso = () => new Date().toISOString()

const initialOrders: Order[] = [
  {
    id: 'SO-2408',
    status: 'packing',
    customer: 'Dai ly An Phat',
    total: 38900000,
    items: 6,
    address: 'Ha Noi',
    note: 'Giao gio hanh chinh',
    createdAt: nowIso(),
  },
  {
    id: 'SO-2409',
    status: 'pending',
    customer: 'Audio Minh Long',
    total: 21450000,
    items: 4,
    address: 'Da Nang',
    note: 'Kiem tra phu kien',
    createdAt: nowIso(),
  },
  {
    id: 'SO-2410',
    status: 'delivering',
    customer: 'SCS Ha Noi',
    total: 56800000,
    items: 8,
    address: 'Ha Noi',
    note: 'Uu tien nhanh',
    createdAt: nowIso(),
  },
  {
    id: 'SO-2411',
    status: 'delivering',
    customer: 'Hoang Gia Media',
    total: 27900000,
    items: 5,
    address: 'TP HCM',
    note: 'Goi bao hiem',
    createdAt: nowIso(),
  },
]

const initialPosts: BlogPost[] = [
  {
    id: 'BL-2001',
    title: 'Danh gia SCS SX Pro Elite',
    category: 'Danh gia',
    status: 'published',
    updatedAt: nowIso(),
    views: 14200,
    author: 'Minh Tran',
    excerpt: 'Tong hop danh gia chat luong am thanh va do ben.',
  },
  {
    id: 'BL-2002',
    title: 'Huong dan setup phong thu voi SCS Professional Studio',
    category: 'Huong dan',
    status: 'published',
    updatedAt: nowIso(),
    views: 6800,
    author: 'Linh Pham',
    excerpt: 'Cac buoc setup nhanh cho phong thu gia dinh.',
  },
  {
    id: 'BL-2003',
    title: 'So sanh SCS SX Wireless Pro va Ultimate',
    category: 'So sanh',
    status: 'scheduled',
    updatedAt: nowIso(),
    views: 0,
    author: 'Quang Vo',
    excerpt: 'Bang so sanh tinh nang va huong dan lua chon.',
  },
  {
    id: 'BL-2004',
    title: 'Xu huong tai nghe 2026',
    category: 'Xu huong',
    status: 'draft',
    updatedAt: nowIso(),
    views: 0,
    author: 'Hien Do',
    excerpt: 'Tong hop xu huong ANC, low latency va khong day.',
  },
]

const initialCustomers: Customer[] = [
  {
    id: 'C-1402',
    name: 'Dai ly SCS Ha Noi',
    tier: 'platinum',
    status: 'active',
    orders: 32,
    lastOrderAt: nowIso(),
    revenue: 324800000,
    email: 'scs.hanoi@example.com',
    phone: '0901234567',
  },
  {
    id: 'C-1411',
    name: 'Audio Minh Long',
    tier: 'gold',
    status: 'active',
    orders: 18,
    lastOrderAt: nowIso(),
    revenue: 158400000,
    email: 'minhlong@example.com',
    phone: '0902223344',
  },
  {
    id: 'C-1420',
    name: 'An Phat Retail',
    tier: 'silver',
    status: 'under_review',
    orders: 6,
    lastOrderAt: nowIso(),
    revenue: 68400000,
    email: 'anphat@example.com',
    phone: '0912345678',
  },
  {
    id: 'C-1433',
    name: 'Hoang Gia Media',
    tier: 'bronze',
    status: 'needs_attention',
    orders: 3,
    lastOrderAt: nowIso(),
    revenue: 21900000,
    email: 'hoanggia@example.com',
    phone: '0988776655',
  },
]

const initialUsers: StaffUser[] = [
  { id: 'U-1001', name: 'Nguyen Thao', role: 'System admin', status: 'active' },
  { id: 'U-1002', name: 'Minh Phan', role: 'Product manager', status: 'active' },
  { id: 'U-1003', name: 'Linh Pham', role: 'Marketing & Content', status: 'active' },
  { id: 'U-1004', name: 'Quang Vu', role: 'Customer care', status: 'pending' },
]

const initialDiscountRules: DiscountRule[] = [
  {
    id: 'WS-2026-01',
    label: 'Don tu 50 trieu',
    range: '50 - 100 trieu',
    percent: 3,
    status: 'active',
    updatedAt: nowIso(),
  },
  {
    id: 'WS-2026-02',
    label: 'Don tu 100 trieu',
    range: '100 - 200 trieu',
    percent: 5,
    status: 'active',
    updatedAt: nowIso(),
  },
  {
    id: 'WS-2026-03',
    label: 'Don tu 200 trieu',
    range: '>= 200 trieu',
    percent: 7,
    status: 'pending',
    updatedAt: nowIso(),
  },
  {
    id: 'WS-2026-Q2',
    label: 'Chuong trinh Q2',
    range: 'Ap dung theo chien dich',
    percent: 2,
    status: 'draft',
    updatedAt: nowIso(),
  },
]

const initialSettings: AppSettings = {
  emailConfirmation: true,
  sessionTimeoutMinutes: 30,
  orderAlerts: true,
  inventoryAlerts: true,
}

const createCode = (prefix: string, currentIds: string[]) => {
  const maxValue = currentIds.reduce((acc, id) => {
    const match = id.match(/(\d+)$/)
    if (!match) return acc
    const parsed = Number(match[1])
    return Number.isNaN(parsed) ? acc : Math.max(acc, parsed)
  }, 0)
  return `${prefix}-${String(maxValue + 1).padStart(4, '0')}`
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [users, setUsers] = useState<StaffUser[]>(initialUsers)
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(initialDiscountRules)
  const [settings, setSettings] = useState<AppSettings>(initialSettings)

  const addOrder: AdminDataContextValue['addOrder'] = (payload) => {
    const nextOrder: Order = {
      id: createCode('SO', orders.map((item) => item.id)),
      status: 'pending',
      customer: payload.customer.trim(),
      total: payload.total,
      items: payload.items,
      address: payload.address.trim(),
      note: payload.note.trim(),
      createdAt: nowIso(),
    }
    setOrders((prev) => [nextOrder, ...prev])
    return nextOrder
  }

  const updateOrderStatus: AdminDataContextValue['updateOrderStatus'] = (id, status) => {
    setOrders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  const deleteOrder: AdminDataContextValue['deleteOrder'] = (id) => {
    setOrders((prev) => prev.filter((item) => item.id !== id))
  }

  const addPost: AdminDataContextValue['addPost'] = (payload) => {
    const nextPost: BlogPost = {
      id: createCode('BL', posts.map((item) => item.id)),
      title: payload.title.trim(),
      category: payload.category.trim(),
      status: payload.status,
      updatedAt: nowIso(),
      views: 0,
      author: payload.author.trim(),
      excerpt: payload.excerpt.trim(),
    }
    setPosts((prev) => [nextPost, ...prev])
    return nextPost
  }

  const updatePostStatus: AdminDataContextValue['updatePostStatus'] = (id, status) => {
    setPosts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, updatedAt: nowIso() } : item,
      ),
    )
  }

  const deletePost: AdminDataContextValue['deletePost'] = (id) => {
    setPosts((prev) => prev.filter((item) => item.id !== id))
  }

  const addCustomer: AdminDataContextValue['addCustomer'] = (payload) => {
    const nextCustomer: Customer = {
      id: createCode('C', customers.map((item) => item.id)),
      name: payload.name.trim(),
      tier: payload.tier,
      status: 'active',
      orders: payload.orders ?? 0,
      lastOrderAt: nowIso(),
      revenue: payload.revenue ?? 0,
      email: payload.email.trim(),
      phone: payload.phone.trim(),
    }
    setCustomers((prev) => [nextCustomer, ...prev])
    return nextCustomer
  }

  const updateCustomerStatus: AdminDataContextValue['updateCustomerStatus'] = (id, status) => {
    setCustomers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  const addUser: AdminDataContextValue['addUser'] = (payload) => {
    const nextUser: StaffUser = {
      id: createCode('U', users.map((item) => item.id)),
      name: payload.name.trim(),
      role: payload.role.trim(),
      status: 'pending',
    }
    setUsers((prev) => [nextUser, ...prev])
    return nextUser
  }

  const updateUserStatus: AdminDataContextValue['updateUserStatus'] = (id, status) => {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  const addDiscountRule: AdminDataContextValue['addDiscountRule'] = (payload) => {
    const nextRule: DiscountRule = {
      id: createCode('WS-2026', discountRules.map((item) => item.id)),
      label: payload.label.trim(),
      range: payload.range.trim(),
      percent: payload.percent,
      status: payload.status,
      updatedAt: nowIso(),
    }
    setDiscountRules((prev) => [nextRule, ...prev])
    return nextRule
  }

  const updateDiscountRuleStatus: AdminDataContextValue['updateDiscountRuleStatus'] = (
    id,
    status,
  ) => {
    setDiscountRules((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, updatedAt: nowIso() } : item,
      ),
    )
  }

  const updateSettings: AdminDataContextValue['updateSettings'] = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const value: AdminDataContextValue = {
    orders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    posts,
    addPost,
    updatePostStatus,
    deletePost,
    customers,
    addCustomer,
    updateCustomerStatus,
    users,
    addUser,
    updateUserStatus,
    discountRules,
    addDiscountRule,
    updateDiscountRuleStatus,
    settings,
    updateSettings,
  }

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  )
}

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider')
  }
  return context
}
