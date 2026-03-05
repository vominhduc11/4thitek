import { ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAdminData, type UserStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { userStatusLabel, userStatusTone } from '../lib/adminLabels'
import { useSimulatedPageLoad } from '../hooks/useSimulatedPageLoad'
import {
  EmptyState,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../components/ui-kit'

const USER_STATUS_OPTIONS: UserStatus[] = ['active', 'pending']

function UsersPage() {
  const { notify } = useToast()
  const { users, addUser, updateUserStatus } = useAdminData()
  const { isLoading } = useSimulatedPageLoad('users-page')

  const [query, setQuery] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    role: '',
  })

  const normalizedQuery = query.trim().toLowerCase()

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (!normalizedQuery) {
          return true
        }
        return (
          user.name.toLowerCase().includes(normalizedQuery) ||
          user.role.toLowerCase().includes(normalizedQuery) ||
          user.id.toLowerCase().includes(normalizedQuery)
        )
      }),
    [normalizedQuery, users],
  )

  const stats = useMemo(() => {
    const active = users.filter((item) => item.status === 'active').length
    const pending = users.filter((item) => item.status === 'pending').length
    return { active, pending }
  }, [users])

  const handleInvite = () => {
    setError('')
    if (!form.name.trim() || !form.role.trim()) {
      setError('Vui long nhap ten va vai tro')
      return
    }

    const created = addUser(form)
    notify(`Da moi ${created.name}`, { title: 'Users', variant: 'success' })
    setShowInvite(false)
    setForm({ name: '', role: '' })
  }

  if (isLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={5} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Quan tri</h3>
          <p className="text-sm text-slate-500">
            Quan ly nhan su va phan quyen truy cap he thong.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="users-search"
            label="Search users"
            placeholder="Tim nguoi dung..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-60 max-w-full"
          />
          <PrimaryButton
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowInvite((value) => !value)}
            type="button"
          >
            Moi nhan su
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Tong nhan su" value={users.length} />
        <StatCard icon={ShieldCheck} label="Dang hoat dong" value={stats.active} tone="success" />
        <StatCard label="Cho duyet" value={stats.pending} tone="info" />
      </div>

      {showInvite ? (
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900">Moi thanh vien moi</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ho va ten"
              value={form.name}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              placeholder="Vai tro"
              value={form.role}
            />
          </div>
          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton onClick={handleInvite} type="button">
              Gui loi moi
            </PrimaryButton>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--accent)]"
              onClick={() => setShowInvite(false)}
              type="button"
            >
              Huy
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Khong co nhan su"
            message="Thu tim tu khoa khac hoac moi thanh vien moi."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <article
                className="flex items-start gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur"
                key={user.id}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
                  {user.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">
                    {user.id} · {user.role}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge tone={userStatusTone[user.status]}>
                      {userStatusLabel[user.status]}
                    </StatusBadge>
                    <select
                      aria-label={`User status ${user.id}`}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      onChange={(event) => {
                        const next = event.target.value as UserStatus
                        updateUserStatus(user.id, next)
                        notify(`Cap nhat ${user.name} -> ${userStatusLabel[next]}`, {
                          title: 'Users',
                          variant: 'info',
                        })
                      }}
                      value={user.status}
                    >
                      {USER_STATUS_OPTIONS.map((option) => (
                        <option key={`${user.id}-${option}`} value={option}>
                          {userStatusLabel[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PagePanel>
  )
}

export default UsersPage
