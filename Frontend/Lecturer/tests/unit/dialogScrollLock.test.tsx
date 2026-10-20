import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Dialog, DialogContent } from '@/shared/components/ui'

function renderDialogs(firstOpen: boolean, secondOpen = false) {
  return (
    <>
      <Dialog open={firstOpen}>
        <DialogContent>Popup 1</DialogContent>
      </Dialog>
      <Dialog open={secondOpen}>
        <DialogContent>Popup 2</DialogContent>
      </Dialog>
    </>
  )
}

describe('Dialog — khóa cuộn trang nền', () => {
  beforeEach(() => {
    // Giả lập thanh cuộn dọc rộng 15px (jsdom không có thanh cuộn thật)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1015 })
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 })
  })

  afterEach(() => {
    document.body.removeAttribute('style')
  })

  it('mở popup: ẩn thanh cuộn và bù đúng bề rộng của nó để trang không giãn ra', () => {
    const { rerender } = render(renderDialogs(false))
    expect(document.body.style.overflow).toBe('')

    rerender(renderDialogs(true))
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('15px')

    rerender(renderDialogs(false))
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')
  })

  it('hai popup cùng mở: đóng một cái vẫn giữ khóa đến khi đóng cái cuối', () => {
    const { rerender } = render(renderDialogs(true, true))
    expect(document.body.style.paddingRight).toBe('15px')

    rerender(renderDialogs(false, true))
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('15px')

    rerender(renderDialogs(false, false))
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')
  })
})
