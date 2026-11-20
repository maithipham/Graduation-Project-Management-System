import { Fragment, useState } from 'react'
import { FolderSearch, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { RubricTreeCriterion, RubricTreeGroup } from '../types'
import { roundWeight, sumGroupWeight, sumTreeWeight } from '../utils/rubricMapper'

interface RubricCriteriaTableProps {
  groups: RubricTreeGroup[]
  readOnly: boolean
  /** Key ô tên cần focus (tiêu chí/nhóm vừa thêm) */
  focusKey: string | null
  onGroupNameChange: (groupKey: string, name: string) => void
  onCriterionChange: (
    groupKey: string,
    criterionKey: string,
    patch: Partial<Pick<RubricTreeCriterion, 'name' | 'weight'>>,
  ) => void
  onAddCriterion: (groupKey: string) => void
  onDeleteGroup: (group: RubricTreeGroup) => void
  onDeleteCriterion: (group: RubricTreeGroup, criterion: RubricTreeCriterion) => void
}

/** Ô nhập % → số (rỗng / sai = 0). Không chặn ngoài 0–100 ở đây: schema báo lỗi khi lưu */
function toWeight(raw: string): number {
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

interface WeightInputProps {
  value: number
  label: string
  onChange: (weight: number) => void
}

/**
 * Ô nhập trọng số giữ nguyên chuỗi đang gõ: xóa trắng ô thì vẫn trống (trọng số tính là 0, schema báo lỗi khi lưu),
 * không hiện lại "0" khiến số gõ tiếp bị dính thành "025". Giá trị đổi từ ngoài (tải lại, hoàn tác) thì cập nhật theo.
 */
function WeightInput({ value, label, onChange }: WeightInputProps) {
  const [text, setText] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (toWeight(text) !== value) setText(String(value))
  }

  return (
    <input
      type="number"
      min={0}
      max={100}
      step={0.01}
      value={text}
      aria-label={label}
      onChange={(event) => {
        setText(event.target.value)
        onChange(toWeight(event.target.value))
      }}
      className={WEIGHT_INPUT_CLASS}
    />
  )
}

/** Thang 10 điểm: 100% = 10 điểm. Tiêu chí đã lưu dùng maxScore BE trả, tiêu chí mới tự tính */
function formatScore(weight: number, maxScore?: number | null): string {
  const score = maxScore ?? roundWeight(weight / 10)
  return `${score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} điểm`
}

const NAME_INPUT_CLASS =
  'h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 outline-none placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100'
const WEIGHT_INPUT_CLASS =
  'h-8 w-16 rounded-lg border border-slate-200 bg-white px-1.5 text-center text-[13px] font-semibold text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100'
const DELETE_BUTTON_CLASS =
  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600'

/** Bảng cây: dòng nhóm (cấp 1) + dòng tiêu chí con (cấp 2) + dòng tổng. Trọng số nhóm = tổng tiêu chí con */
export function RubricCriteriaTable({
  groups,
  readOnly,
  focusKey,
  onGroupNameChange,
  onCriterionChange,
  onAddCriterion,
  onDeleteGroup,
  onDeleteCriterion,
}: RubricCriteriaTableProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
        <FolderSearch className="mx-auto mb-2 h-9 w-9 text-slate-300" />
        <p className="text-[13.5px] font-semibold text-slate-600">Chưa có tiêu chí nào</p>
        <p className="mt-1 text-[12px] text-slate-400">
          {readOnly
            ? 'Mẫu rubric này chưa được thiết lập tiêu chí.'
            : 'Nhấn "Thêm nhóm tiêu chí đánh giá mới" bên dưới để bắt đầu thiết lập.'}
        </p>
      </div>
    )
  }

  const total = sumTreeWeight(groups)
  const totalOk = total === 100
  const columnCount = readOnly ? 4 : 5

  return (
    <table className="w-full border-separate border-spacing-y-1 text-[13px]">
      <thead>
        <tr className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
          <th className="w-14 rounded-l-xl bg-[#E5ECF4] px-3 py-2.5 text-center">STT</th>
          <th className="min-w-[420px] bg-[#E5ECF4] px-3 py-2.5 text-left">Tên tiêu chí đánh giá</th>
          <th className="w-36 bg-[#E5ECF4] px-3 py-2.5 text-center">Trọng số (%)</th>
          <th className={cn('w-36 bg-[#E5ECF4] px-3 py-2.5 text-center', readOnly && 'rounded-r-xl')}>Điểm tối đa</th>
          {!readOnly && <th className="w-24 rounded-r-xl bg-[#E5ECF4] px-3 py-2.5 text-center">Thao tác</th>}
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => {
          const groupWeight = sumGroupWeight(group)
          return (
            <Fragment key={group.key}>
              {/* Dòng nhóm tiêu chí lớn */}
              <tr className="bg-[#E5ECF4]/70">
                <td className="rounded-l-xl px-3 py-2 text-center font-bold text-slate-800">{group.code}</td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="font-bold text-slate-800 uppercase">{group.name || '—'}</span>
                  ) : (
                    <input
                      type="text"
                      value={group.name}
                      maxLength={255}
                      autoFocus={focusKey === group.key}
                      placeholder="Nhập tên nhóm tiêu chí..."
                      aria-label={`Tên nhóm tiêu chí ${group.code}`}
                      onChange={(event) => onGroupNameChange(group.key, event.target.value)}
                      className={cn(NAME_INPUT_CLASS, 'font-bold uppercase')}
                    />
                  )}
                </td>
                <td
                  className="px-3 py-2 text-center font-bold text-slate-800"
                  title="Trọng số nhóm = tổng trọng số các tiêu chí con"
                >
                  {groupWeight}%
                </td>
                <td className={cn('px-3 py-2 text-center font-bold text-slate-800', readOnly && 'rounded-r-xl')}>
                  {formatScore(groupWeight)}
                </td>
                {!readOnly && (
                  <td className="rounded-r-xl px-3 py-2">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        aria-label={`Xóa nhóm ${group.code}`}
                        onClick={() => onDeleteGroup(group)}
                        className={DELETE_BUTTON_CLASS}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>

              {/* Dòng tiêu chí con */}
              {group.criteria.map((criterion) => (
                <tr key={criterion.key} className="bg-white">
                  <td className="rounded-l-xl border-y border-l border-slate-100 px-3 py-2 text-right text-[12.5px] font-semibold text-slate-400">
                    {criterion.code}
                  </td>
                  <td className="border-y border-slate-100 px-3 py-2">
                    {readOnly ? (
                      <span className="text-slate-700">{criterion.name || '—'}</span>
                    ) : (
                      <input
                        type="text"
                        value={criterion.name}
                        maxLength={500}
                        autoFocus={focusKey === criterion.key}
                        placeholder="Nhập tên tiêu chí con..."
                        aria-label={`Tên tiêu chí ${criterion.code}`}
                        onChange={(event) => onCriterionChange(group.key, criterion.key, { name: event.target.value })}
                        className={NAME_INPUT_CLASS}
                      />
                    )}
                  </td>
                  <td className="border-y border-slate-100 px-3 py-2 text-center">
                    {readOnly ? (
                      <span className="font-semibold text-slate-700">{criterion.weight}%</span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <WeightInput
                          value={criterion.weight}
                          label={`Trọng số tiêu chí ${criterion.code}`}
                          onChange={(weight) => onCriterionChange(group.key, criterion.key, { weight })}
                        />
                        <span className="font-semibold text-slate-500">%</span>
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      'border-y border-slate-100 px-3 py-2 text-center text-slate-600',
                      readOnly && 'rounded-r-xl border-r',
                    )}
                  >
                    {/* Đang sửa thì tính lại theo trọng số mới; chỉ xem thì dùng số BE trả */}
                    {formatScore(criterion.weight, readOnly ? criterion.maxScore : null)}
                  </td>
                  {!readOnly && (
                    <td className="rounded-r-xl border-y border-r border-slate-100 px-3 py-2">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          aria-label={`Xóa tiêu chí ${criterion.code}`}
                          onClick={() => onDeleteCriterion(group, criterion)}
                          className={DELETE_BUTTON_CLASS}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {!readOnly && (
                <tr>
                  <td />
                  <td colSpan={columnCount - 1} className="px-3 pb-2">
                    <button
                      type="button"
                      onClick={() => onAddCriterion(group.key)}
                      className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-semibold text-[#1565C0] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm dòng tiêu chí con vào nhóm "{group.name.trim() || group.code}"
                    </button>
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}

        {/* Dòng tổng */}
        <tr className="bg-[#F2F8FF]">
          <td className="rounded-l-xl px-3 py-3" />
          <td className={cn('px-3 py-3 font-bold tracking-wide', totalOk ? 'text-[#1565C0]' : 'text-rose-600')}>
            TỔNG ĐIỂM
          </td>
          <td className={cn('px-3 py-3 text-center font-bold', totalOk ? 'text-[#1565C0]' : 'text-rose-600')}>
            {total}%
          </td>
          <td
            className={cn(
              'px-3 py-3 text-center font-bold',
              totalOk ? 'text-[#1565C0]' : 'text-rose-600',
              readOnly && 'rounded-r-xl',
            )}
          >
            {formatScore(total)}
          </td>
          {!readOnly && <td className="rounded-r-xl px-3 py-3" />}
        </tr>
      </tbody>
    </table>
  )
}
