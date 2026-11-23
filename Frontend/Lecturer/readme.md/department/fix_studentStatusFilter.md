# Prompt: Sửa FE cột / bộ lọc "Trạng thái" danh sách sinh viên theo BE mới

> Brief giao cho phiên chat làm frontend. Đọc kèm `AGENTS.md`, `readme.md/department/api_addStudent.md`
> (Mục 4.1.3, 6.5) và skill `connect-api`, `verify-changes`.
> Phạm vi: chỉ module `src/features/department/student_management/`. KHÔNG sửa module khác
> (ví dụ `features/lecturer/defense_management/types.ts` có union riêng, không liên quan).

---

## 1. BE đã thay đổi gì (`GET /student`, `GET /student/export`)

Trước đây `status` = tên `ThesisStage` hoặc `TopicStatus` lấy thẳng từ DB, nên hiển thị sai 2 trường hợp:

- Sinh viên **đã gửi đơn đăng ký GVHD** vẫn hiện "Chưa đăng ký GVHD".
- TBM chốt danh sách GVHD → đề tài lên Giai đoạn 2 dù **chưa có tên đề tài** → hiện "Đã chốt tên đề tài"
  trong khi cột Đề tài là "(chưa đăng ký)".

Giờ BE tính **trạng thái hiển thị** (enum `StudentListStatus`). Cùng một giá trị dùng cho:
field `status` / `statusLabel` của từng dòng, tham số lọc `?status=`, và cột Trạng thái trong file Excel export.

| `status` (gửi lên / nhận về)  | `statusLabel` BE trả về                  | Khi nào                                                                                     |
| :---------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------ |
| `STAGE_1_REGISTERING_ADVISOR` | Chưa đăng ký GVHD                        | Giai đoạn 1, chưa có GVHD, **chưa** có đơn đăng ký còn hiệu lực                            |
| `STAGE_1_ADVISOR_REQUESTED` 🆕 | Đã gửi đơn đăng ký GVHD                  | Giai đoạn 1, chưa có GVHD, đã có đơn `PENDING` / `TEACHER_APPROVED` / `HOD_APPROVED` trong kỳ |
| `STAGE_1_ADVISOR_ASSIGNED`    | Đã phân công GVHD                        | Đã phân công GVHD **hoặc** Giai đoạn 2 nhưng chưa có tên đề tài                            |
| `STAGE_2_TOPIC_CONFIRMED`     | Đã chốt tên đề tài                       | Giai đoạn 2 và đã có tên đề tài                                                             |
| `STAGE_3_OUTLINE_APPROVED`    | Đã duyệt đề cương                        |                                                                                             |
| `STAGE_4_REPORT_APPROVED`     | Đã duyệt báo cáo                         |                                                                                             |
| `STAGE_5_REVIEW_PASSED`       | Đạt phản biện                            |                                                                                             |
| `STAGE_6_DEFENSE_COMPLETED`   | Đã bảo vệ hội đồng                       |                                                                                             |
| `DISQUALIFIED`                | Bị đình chỉ / Không đủ điều kiện đi tiếp | Ưu tiên cao nhất (bất kể giai đoạn)                                                         |
| `CANCELLED`                   | Đã hủy                                   | Ưu tiên cao nhất (bất kể giai đoạn)                                                         |

Ghi chú:

- Bộ lọc lọc **đúng theo cột đang hiển thị**. Ví dụ `?status=STAGE_1_REGISTERING_ADVISOR` không còn trả
  sinh viên đã gửi đơn; `?status=STAGE_2_TOPIC_CONFIRMED` không còn trả đề tài chưa có tên.
- Giá trị không thuộc bảng → vẫn `400`, code `3026` như cũ. Không đổi request / response shape nào khác.
- Đơn do TBM phân công thẳng (`ASSIGNED_BY_HOD`) không tính là "Đã gửi đơn".

---

## 2. Việc cần sửa ở FE

### 2.1. `types.ts` – union `StudentThesisStatus`

Thêm `'STAGE_1_ADVISOR_REQUESTED'` ngay sau `'STAGE_1_REGISTERING_ADVISOR'`. Sửa comment JSDoc: đây là
**trạng thái hiển thị do BE tính** (không còn là tên `ThesisStage` gốc).

### 2.2. `utils/studentFilters.ts` – `STUDENT_STATUS_OPTIONS`

Thay đúng theo bảng Mục 1 (thứ tự theo tiến độ), nhãn **khớp `statusLabel` BE**:

```ts
export const STUDENT_STATUS_OPTIONS: { value: StudentThesisStatus; label: string }[] = [
  { value: 'STAGE_1_REGISTERING_ADVISOR', label: 'Chưa đăng ký GVHD' }, // cũ ghi "Đang đăng ký GVHD" → lệch BE
  { value: 'STAGE_1_ADVISOR_REQUESTED', label: 'Đã gửi đơn đăng ký GVHD' }, // mới
  { value: 'STAGE_1_ADVISOR_ASSIGNED', label: 'Đã phân công GVHD' },
  { value: 'STAGE_2_TOPIC_CONFIRMED', label: 'Đã chốt tên đề tài' },
  { value: 'STAGE_3_OUTLINE_APPROVED', label: 'Đã duyệt đề cương' },
  { value: 'STAGE_4_REPORT_APPROVED', label: 'Đã duyệt báo cáo' },
  { value: 'STAGE_5_REVIEW_PASSED', label: 'Đạt phản biện' },
  { value: 'STAGE_6_DEFENSE_COMPLETED', label: 'Đã bảo vệ hội đồng' },
  { value: 'DISQUALIFIED', label: 'Bị đình chỉ / Không đủ điều kiện đi tiếp' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]
```

### 2.3. `components/StudentStatusBadge.tsx` – `STATUS_STYLES`

`Record<StudentThesisStatus, string>` sẽ báo lỗi TypeScript nếu thiếu key mới. Thêm:

```ts
STAGE_1_ADVISOR_REQUESTED: 'border-orange-200 bg-orange-50 text-orange-700',
```

(vàng = chưa đăng ký, cam = đã gửi đơn chờ duyệt, xanh = đã có GVHD). Cập nhật comment màu ở đầu file.
Chữ trên badge vẫn lấy `statusLabel` của BE, giữ fallback `UNKNOWN_STYLE`.

### 2.4. `utils/studentTable.ts` – `canDeleteStudent`

**Giữ nguyên** điều kiện `status === 'STAGE_1_REGISTERING_ADVISOR'`. Với BE mới, SV đã gửi đơn có
`status = STAGE_1_ADVISOR_REQUESTED` nên tự động **không** hiện nút Xóa — đúng nghiệp vụ, vì BE chỉ cho xóa
đề tài chưa có đơn đăng ký. Chỉ cập nhật comment cho rõ ý này.

### 2.5. Tài liệu `readme.md/department/api_addStudent.md`

- Mục 0: thêm dòng #17 mô tả thay đổi ở Mục 1 file này.
- Mục 4.1.3: thay bảng bằng bảng Mục 1 (kèm cột badge), sửa nhãn "Đang đăng ký GVHD" → "Chưa đăng ký GVHD".
- Mục 4.1 (union TS mẫu) và Mục 6.5: thêm `STAGE_1_ADVISOR_REQUESTED`, ghi chú SV đã gửi đơn không xóa được.

### 2.6. Test (nếu module có test cho `studentFilters` / `StudentStatusBadge` / `canDeleteStudent`)

Cập nhật nhãn mới và thêm case `STAGE_1_ADVISOR_REQUESTED` (badge màu cam, không hiện nút Xóa).

---

## 3. Kiểm tra sau khi sửa

- [ ] `npm run build` / type-check không lỗi (đặc biệt `STATUS_STYLES` đủ key).
- [ ] Dropdown Trạng thái có 10 option, nhãn trùng `statusLabel` trên badge.
- [ ] SV đã gửi đơn đăng ký GVHD → badge cam "Đã gửi đơn đăng ký GVHD", không có nút Xóa.
- [ ] Chọn lọc "Đã gửi đơn đăng ký GVHD" → request `GET /student?status=STAGE_1_ADVISOR_REQUESTED` → `200`, code `1000`.
- [ ] Đề tài đã chốt GVHD nhưng chưa có tên → hiện "Đã phân công GVHD", không còn "Đã chốt tên đề tài".
- [ ] Export Excel với bộ lọc mới → cột Trạng thái khớp bảng.
