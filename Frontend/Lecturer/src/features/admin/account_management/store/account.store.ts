import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserAccount, AddAccountFormValues, AccountRole, AccountStatus } from '../types/account.types'

interface AccountState {
  accounts: UserAccount[]
  addAccount: (values: AddAccountFormValues) => UserAccount
  updateAccount: (
    id: number,
    data: { role?: AccountRole; status?: AccountStatus },
  ) => void
  addActivity: (accountId: number, action: string) => void
  resetToInitial: () => void
}

const initialAccounts: UserAccount[] = []

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: initialAccounts,

      addAccount: (values) => {
        const currentAccounts = get().accounts
        const newId = currentAccounts.length
          ? Math.max(...currentAccounts.map((a) => a.id)) + 1
          : 1
        const now = new Date()
        const formattedDate = new Intl.DateTimeFormat('vi-VN').format(now)
        const formattedTime = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
          .format(now)
          .replace(',', '')

        const resolvedUnit = values.unit
          ? values.unit
          : values.major
            ? values.major
            : values.facultyId
              ? values.facultyId
              : '—'

        const newAccount: UserAccount = {
          id: newId,
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status,
          phone: values.phone || '—',
          unit: resolvedUnit,
          major: values.major || undefined,
          batch: values.batch || undefined,
          className: values.className || undefined,
          createdAt: formattedDate,
          lastLogin: '—',
          activities: [
            {
              id: `${newId}-${Date.now()}`,
              action: 'Thêm tài khoản mới',
              time: formattedTime,
            },
          ],
        }

        set({ accounts: [newAccount, ...currentAccounts] })
        return newAccount
      },

      updateAccount: (id, data) => {
        const now = new Date()
        const formattedTime = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
          .format(now)
          .replace(',', '')

        set((state) => {
          const updated = state.accounts.map((acc) => {
            if (acc.id !== id) return acc

            const newActivities = [...acc.activities]
            if (data.role && data.role !== acc.role) {
              newActivities.unshift({
                id: `${id}-${Date.now()}-role`,
                action: `Cập nhật vai trò thành: ${data.role}`,
                time: formattedTime,
              })
            }
            if (data.status && data.status !== acc.status) {
              newActivities.unshift({
                id: `${id}-${Date.now()}-status`,
                action:
                  data.status === 'active'
                    ? 'Tài khoản được kích hoạt'
                    : 'Tài khoản được dừng hoạt động',
                time: formattedTime,
              })
            }

            return {
              ...acc,
              ...(data.role ? { role: data.role } : {}),
              ...(data.status ? { status: data.status } : {}),
              activities: newActivities,
            }
          })

          return { accounts: updated }
        })
      },

      addActivity: (accountId, action) => {
        const formattedTime = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
          .format(new Date())
          .replace(',', '')

        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === accountId
              ? {
                  ...acc,
                  activities: [
                    {
                      id: `${accountId}-${Date.now()}`,
                      action,
                      time: formattedTime,
                    },
                    ...acc.activities,
                  ],
                }
              : acc,
          ),
        }))
      },

      resetToInitial: () => set({ accounts: initialAccounts }),
    }),
    {
      name: 'gpms_admin_accounts',
      version: 2,
      migrate: () => ({ accounts: [] }),
    },
  ),
)
