---
name: verify-changes
description: Kiểm tra code trước khi báo hoàn thành — chạy kiểm tra kiểu TypeScript, lint, test, build và rà checklist quy tắc dự án. Dùng sau mỗi lần sửa code, trước khi nói "xong", trước khi commit; hoặc khi người dùng nói "kiểm tra lại", "chạy test", "verify", "check build".
---

# Kiểm tra trước khi báo "xong"

## 1. Chạy lần lượt (trong thư mục `Frontend/Student`)

| # | Lệnh | Kiểm tra |
| --- | --- | --- |
| 1 | `npx tsc -b` | lỗi kiểu TypeScript |
| 2 | `npm run lint` | oxlint (rules of hooks, …) |
| 3 | `npm test` | Vitest (`tests/unit`, `tests/integration`) |
| 4 | `npm run build` | build production |

- Bước nào lỗi → sửa → **chạy lại từ bước 1**.
- Có sửa file trong `.agents/skills/` → chạy thêm `npm run sync-skills` trước `npm test`
  (có test báo lỗi khi bản skill của Claude lệch bản gốc).
- Sửa logic dùng chung (`src/shared/`, hook, util) mà chưa có test → viết thêm test trong `tests/unit/`.

## 2. Rà nhanh phần vừa sửa

- [ ] Chữ hiển thị tiếng Việt có dấu; tên biến/hàm/file tiếng Anh.
- [ ] Import ngoài feature dùng `@/…`, không deep import vào feature khác, `index.ts` không export page.
- [ ] Không có `console.log`, code comment-out, dữ liệu giả để test tạm.
- [ ] Gọi API chỉ qua hook TanStack Query; không `toast.error`; không token trong `localStorage`;
      không gửi `studentId` của chính mình khi Controller không yêu cầu.
- [ ] Form: có `noValidate`, lỗi hiện bằng `FormField` (chữ đỏ dưới ô).
- [ ] Đang tải → `Skeleton`; nút submit `disabled={isPending}` + đổi chữ.
- [ ] Route mới nằm trong `children` của `StudentLayout`; có mục menu trong `studentNav.config.ts` nếu cần.
- [ ] Nhóm menu có mục con: mỗi mục con có file page + route riêng, phần chung nằm trong `components/`
      (skill `create-feature`, bước 5) — không dùng chung một page qua prop.
- [ ] Không chạm vào file ngoài phạm vi yêu cầu.

## 3. Kiểm tra trên trình duyệt (khi thay đổi có giao diện)

`npm run dev` rồi mở đúng trang vừa sửa: xem hiển thị, bấm thử thao tác chính, xem Console không có lỗi đỏ.
Không làm được (ví dụ cần backend chưa chạy) → nói rõ là **chưa kiểm tra trên trình duyệt**.

## 4. Báo cáo

- Báo **đúng kết quả thật** của từng lệnh (ví dụ "tsc sạch, lint sạch, 34/34 test, build ok").
- Còn lỗi → nói rõ lỗi gì, ở đâu; **không báo "xong"**.
- Phần chưa kiểm tra được → nói rõ, không bỏ qua im lặng.

## KHÔNG được làm

- Xóa, `skip`, hay sửa test cho "qua" khi chưa hiểu vì sao test hỏng.
- Thêm `// @ts-ignore`, `any`, hay tắt rule lint để né lỗi.
- Commit / push khi người dùng chưa đồng ý.
