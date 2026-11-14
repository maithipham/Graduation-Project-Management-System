import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { apiClient } from '@/shared/api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UploadTemplateDialog } from '@/features/department/template_management/components/UploadTemplateDialog'

function renderUpload() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <UploadTemplateDialog open onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('UploadTemplateDialog', () => {
  it('bấm X bỏ file đã chọn, rồi chọn được file khác', async () => {
    const user = userEvent.setup()
    renderUpload()

    const first = new File(['a'], 'Phiếu chấm Rubric - GVPB.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    await user.upload(screen.getByLabelText(/File tài liệu/), first)
    expect(screen.getByText('Phiếu chấm Rubric - GVPB.docx')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bỏ chọn file' }))
    expect(screen.queryByText('Phiếu chấm Rubric - GVPB.docx')).not.toBeInTheDocument()
    expect(screen.getByText('Bấm để chọn file')).toBeInTheDocument()

    const second = new File(['b'], 'Mau-de-cuong.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText(/File tài liệu/), second)
    expect(screen.getByText('Mau-de-cuong.pdf')).toBeInTheDocument()
    // Tên tự điền theo file cũ đã được xóa → điền lại theo file mới
    expect(screen.getByLabelText(/Tên tài liệu/)).toHaveValue('Mau-de-cuong')
  })

  it('đang tải lên vẫn bấm X được: hủy lượt tải và chọn file khác', async () => {
    let aborted = false
    vi.spyOn(apiClient, 'post').mockImplementation(
      (_url, _data, config) =>
        new Promise((_resolve, reject) => {
          config?.signal?.addEventListener?.('abort', () => {
            aborted = true
            reject(new axios.CanceledError())
          })
        }),
    )
    const user = userEvent.setup()
    renderUpload()

    await user.upload(
      screen.getByLabelText(/File tài liệu/),
      new File(['a'], 'Rubric.docx', { type: 'application/msword' }),
    )
    await user.selectOptions(screen.getByLabelText(/Loại tài liệu/), 'TEMPLATE')
    await user.click(screen.getByRole('button', { name: /Tải lên/ }))
    expect(await screen.findByText('Đang tải lên...')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bỏ chọn file' }))
    expect(aborted).toBe(true)
    expect(await screen.findByText('Bấm để chọn file')).toBeInTheDocument()
    expect(screen.queryByText('Đang tải lên...')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.upload(
      screen.getByLabelText(/File tài liệu/),
      new File(['b'], 'Mau-de-cuong.pdf', { type: 'application/pdf' }),
    )
    expect(screen.getByText('Mau-de-cuong.pdf')).toBeInTheDocument()
  })
})
