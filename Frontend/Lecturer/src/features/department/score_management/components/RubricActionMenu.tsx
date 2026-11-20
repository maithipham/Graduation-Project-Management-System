import { Copy, Trash2 } from 'lucide-react'
import { ActionMenu, type ActionMenuItem } from './ActionMenu'

interface RubricActionMenuProps {
  canDelete: boolean
  onClone: () => void
  onDelete: () => void
}

/** Nút "···" ở cột thao tác: Nhân bản, Xóa (chỉ bản nháp) */
export function RubricActionMenu({ canDelete, onClone, onDelete }: RubricActionMenuProps) {
  const items: ActionMenuItem[] = [{ label: 'Nhân bản', icon: Copy, onSelect: onClone }]
  if (canDelete) items.push({ label: 'Xóa', icon: Trash2, onSelect: onDelete, danger: true })
  return <ActionMenu items={items} />
}
