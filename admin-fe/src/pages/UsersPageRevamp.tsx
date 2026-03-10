import { ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAdminData, type UserStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { userStatusLabel, userStatusTone } from '../lib/adminLabels'
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  inputClass,
  tableCardClass,
  tableMetaClass,
} from '../components/ui-kit'

const USER_STATUS_OPTIONS: UserStatus[] = ['active', 'pending']

const copyByLanguage = {
  vi: {
    title: 'Người dùng nội bộ',
    description: 'Quản lý tài khoản admin, phân vai trò và xác nhận trạng thái kích hoạt an toàn.',
    searchLabel: 'Tìm người dùng',
    searchPlaceholder: 'Tìm theo tên, vai trò hoặc mã...',
    addUser: 'Mời người dùng',
    total: 'Tổng tài khoản',
    active: 'Đang hoạt động',
    pending: 'Chờ duyệt',
    createTitle: 'Tạo tài khoản mới',
    name: 'Họ và tên',
    role: 'Vai trò',
    save: 'Gửi lời mời',
    cancel: 'Hủy',
    validate: 'Vui lòng nhập đủ tên và vai trò.',
    emptyTitle: 'Không có người dùng phù hợp',
    emptyMessage: 'Thử đổi từ khóa tìm kiếm hoặc mời thêm người dùng.',
    loadTitle: 'Không tải được người dùng',
    loadFallback: 'Danh sách người dùng chưa thể tải.',
    confirmTitle: 'Xác nhận đổi trạng thái người dùng',
    confirmMessage: 'Chuyển tài khoản này sang trạng thái "{status}"?',
  },
  en: {
    title: 'Internal users',
    description: 'Manage admin accounts, role assignment, and safe activation status changes.',
    searchLabel: 'Search users',
    searchPlaceholder: 'Search by name, role, or id...',
    addUser: 'Invite user',
    total: 'Total users',
    active: 'Active',
    pending: 'Pending',
    createTitle: 'Create user',
    name: 'Full name',
    role: 'Role',
    save: 'Send invite',
    cancel: 'Cancel',
    validate: 'Name and role are required.',
    emptyTitle: 'No matching users',
    emptyMessage: 'Try another search term or invite a new user.',
    loadTitle: 'Unable to load users',
    loadFallback: 'The user list could not be loaded.',
    confirmTitle: 'Confirm user status change',
    confirmMessage: 'Change this account to "{status}"?',
  },
} as const

function UsersPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { users, usersState, addUser, updateUserStatus, reloadResource } = useAdminData()
  const [query, setQuery] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    role: '',
  })

  const normalizedQuery = query.trim().toLowerCase()
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        !normalizedQuery
          ? true
          : `${user.name} ${user.role} ${user.id}`.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery, users],
  )

  const stats = useMemo(
    () => ({
      active: users.filter((item) => item.status === 'active').length,
      pending: users.filter((item) => item.status === 'pending').length,
    }),
    [users],
  )

  const handleInvite = async () => {
    setFormError('')
    if (!form.name.trim() || !form.role.trim()) {
      setFormError(copy.validate)
      return
    }

    try {
      await addUser(form)
      setShowInvite(false)
      setForm({ name: '', role: '' })
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : copy.loadFallback)
    }
  }

  if (usersState.status === 'loading' || usersState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={5} />
      </PagePanel>
    )
  }

  if (usersState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={usersState.error || copy.loadFallback}
          onRetry={() => void reloadResource('users')}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <SearchInput
            id="users-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-80"
          />
          <PrimaryButton icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowInvite((current) => !current)} type="button">
            {copy.addUser}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label={copy.total} value={users.length} />
        <StatCard icon={ShieldCheck} label={copy.active} value={stats.active} tone="success" />
        <StatCard label={copy.pending} value={stats.pending} tone="info" />
      </div>

      {showInvite ? (
        <div className={`${formCardClass} mt-6`}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.createTitle}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder={copy.name}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              className={inputClass}
              placeholder={copy.role}
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            />
          </div>
          {formError ? <p className="mt-2 text-sm text-rose-600">{formError}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto" onClick={() => void handleInvite()} type="button">
              {copy.save}
            </PrimaryButton>
            <PrimaryButton
              className="w-full bg-slate-900 shadow-[0_16px_30px_rgba(15,23,42,0.22)] hover:bg-slate-800 sm:w-auto"
              onClick={() => setShowInvite(false)}
              type="button"
            >
              {copy.cancel}
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredUsers.length === 0 ? (
          <EmptyState icon={Users} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <article key={user.id} className={tableCardClass}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
                    {user.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--ink)]">{user.name}</p>
                    <p className={tableMetaClass}>
                      {user.id} · {user.role}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge tone={userStatusTone[user.status]}>{userStatusLabel[user.status]}</StatusBadge>
                      <select
                        aria-label={`${copy.title} ${user.id}`}
                        className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold text-[var(--ink)]"
                        value={user.status}
                        onChange={async (event) => {
                          const next = event.target.value as UserStatus
                          if (next === user.status) return

                          const approved = await confirm({
                            title: copy.confirmTitle,
                            message: copy.confirmMessage.replace('{status}', userStatusLabel[next]),
                            tone: next === 'pending' ? 'warning' : 'info',
                            confirmLabel: userStatusLabel[next],
                          })
                          if (!approved) {
                            event.currentTarget.value = user.status
                            return
                          }

                          try {
                            await updateUserStatus(user.id, next)
                          } catch (updateError) {
                            notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                              title: copy.title,
                              variant: 'error',
                            })
                          }
                        }}
                      >
                        {USER_STATUS_OPTIONS.map((option) => (
                          <option key={`${user.id}-${option}`} value={option}>
                            {userStatusLabel[option]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default UsersPageRevamp
