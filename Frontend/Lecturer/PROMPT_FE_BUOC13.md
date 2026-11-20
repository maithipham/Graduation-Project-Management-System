# PROMPT CODE FE – BƯỚC 13: LỊCH BẢO VỆ – XẾP CA BẢO VỆ CHO SINH VIÊN (Inter 3)

> Copy toàn bộ phần dưới đây làm prompt cho AI code FE. Thư mục làm việc: `Frontend/Lecturer/`.

---

## Vai trò & mục tiêu

Bạn là FE developer của portal Lecturer (React 19 + TypeScript + Vite, Tailwind v4, React Router v7, TanStack Query v5, Zustand v5, axios, zod, lucide-react).
Trước khi code, **đọc `AGENTS.md`** và skill `connect-api` (`.agents/skills/connect-api/SKILL.md` + `templates/`), làm đúng quy ước ở đó.

Nhiệm vụ: thêm màn **"Lịch bảo vệ"** trong chi tiết Hội đồng của giảng viên, nối với backend thật cho **Bước 13 – xếp ca bảo vệ**:
- Mọi thành viên Hội đồng (Chủ tịch / Thư ký / Ủy viên) **xem** lịch bảo vệ.
- Chỉ **Chủ tịch / Thư ký** được **xếp / sửa / gỡ** ca bảo vệ (dựa vào cờ `canSchedule` / `canUnschedule` backend trả về, KHÔNG tự suy luận quyền ở FE).

Tham khảo giao diện mock (chỉ để tham khảo bố cục, KHÔNG copy code JS thuần):
`C:\Users\Dwight\Downloads\gv_ui\gv_ui\src\modules\BaoVeDoAn\hoiDong.js` – hàm `renderDefenseScheduleTab` (khoảng dòng 1613–2300): cột trái danh sách sinh viên (lọc Tất cả / Chưa xếp ca / Đã xếp ca, chọn nhiều), cột phải các khối ca (Ca Sáng / Ca Chiều / Ca Tối), kéo thả sinh viên vào ca, gỡ khỏi ca, đặt lại lịch.

## 1. Phạm vi file

Feature: `src/features/lecturer/defense_management/`

| File | Việc cần làm |
|---|---|
| `src/shared/api/endpoints.ts` | Thêm nhóm `defenseSchedule` (mục 2) |
| `types.ts` | Thêm type ở mục 3 |
| `services/defenseSchedule.service.ts` (mới) | 3 hàm gọi API, trả `res.data.data` |
| `hooks/useDefenseSchedule.ts` (mới) | Query key + `useCouncilDefenseSchedule`, `useScheduleDefenseSlot`, `useUnscheduleDefenseSlot` |
| `components/DefenseScheduleBoard.tsx` (mới) | Màn lịch bảo vệ (danh sách SV + các khối ca) |
| `components/ScheduleDefenseSlotDialog.tsx` (mới) | Dialog xếp / sửa ca cho 1 sinh viên (form zod) |
| `pages/CouncilExaminerPage.tsx` | Thêm Tabs (dùng `shared/components/ui/tabs.tsx`): **"Phân công phản biện"** (nội dung hiện tại) và **"Lịch bảo vệ"** (`DefenseScheduleBoard`). Giữ nguyên header + danh sách thành viên ở trên. Tab đang chọn lưu ở query param `?tab=schedule` |

KHÔNG sửa logic Bước 12 (phân công GVPB, chấm phản biện) ngoài việc bọc vào tab.

## 2. API backend

Base `http://localhost:8080`, response chung `{ code, message, data }`, `code === 1000` là thành công.
Id đều là UUID. Ngày giờ dạng ISO `yyyy-MM-ddTHH:mm:ss` (LocalDateTime, **không có timezone** – không dùng `toISOString()` vì sẽ lệch múi giờ; tự ghép chuỗi từ ngày + giờ người dùng chọn).

```ts
defenseSchedule: {
  councilSchedule: (councilPublicId: string) => `/defense-council/${councilPublicId}/defense-schedule`,
  slot: (defenseAssignmentPublicId: string) => `/defense-assignment/${defenseAssignmentPublicId}/defense-slot`,
}
```

| Hàm service | Method & URL | Body / Kết quả |
|---|---|---|
| `getCouncilSchedule(councilPublicId)` | `GET /defense-council/{councilPublicId}/defense-schedule` | trả `CouncilDefenseSchedule` |
| `scheduleSlot(defenseAssignmentPublicId, data)` | `PUT /defense-assignment/{id}/defense-slot` | body `ScheduleDefenseSlotRequest`, message "Xếp ca bảo vệ thành công" |
| `unscheduleSlot(defenseAssignmentPublicId)` | `DELETE /defense-assignment/{id}/defense-slot` | message "Gỡ ca bảo vệ thành công" |

PUT/DELETE truyền `{ skipErrorToast: true }` giống `examinerReview.service.ts` khi cần hiện lỗi ngay trong dialog; nếu không thì để interceptor tự toast (không `toast.error` lặp lại).

## 3. Types (thêm vào `types.ts`)

```ts
export interface DefenseSlot {
  defenseAssignmentPublicId: string
  thesisTopicPublicId: string
  studentCode: string
  studentName: string
  className: string | null
  topicName: string | null
  supervisorName: string | null
  coSupervisorName: string | null
  defenseStatus: DefenseStatus        // READY_FOR_DEFENSE = chờ xếp ca, SCHEDULED = đã xếp ca
  currentStage: ThesisStage
  examinerScore: number | null
  // Ca bảo vệ – null khi chưa xếp
  slotOrder: number | null
  defenseStartTime: string | null     // "2026-12-10T08:00:00"
  defenseEndTime: string | null
  room: string | null
  scheduledAt: string | null
  scheduledByName: string | null
  canSchedule: boolean                // được xếp / sửa ca SV này
  canUnschedule: boolean              // được gỡ ca SV này
}

export interface CouncilDefenseSchedule {
  councilPublicId: string
  code: string
  name: string
  majorName: string
  location: string | null             // phòng mặc định của Hội đồng
  status: CouncilStatus
  defenseStartTime: string | null     // khung lịch tổng thể của Hội đồng
  defenseEndTime: string | null
  deadlineStartAt: string | null      // mốc "Thời gian tổ chức Hội đồng bảo vệ" (null = ngành chưa cấu hình)
  deadlineEndAt: string | null
  myRole: CouncilMemberRole
  canSchedule: boolean                // CT/TK + HĐ đã công bố + đã có mốc
  students: DefenseSlot[]             // đã xếp ca theo slotOrder trước, chưa xếp ca ở cuối
}

export interface ScheduleDefenseSlotRequest {
  slotOrder: number                   // >= 1, không trùng trong Hội đồng
  defenseStartTime: string            // ISO local
  defenseEndTime: string
  room?: string | null                // bỏ trống -> BE lấy location của Hội đồng
}
```

Lưu ý: sinh viên có `defenseStatus` khác `READY_FOR_DEFENSE` / `SCHEDULED` (chưa đạt phản biện, không đạt, đã bảo vệ xong) vẫn có trong danh sách nhưng `canSchedule = false` → hiển thị mờ với badge trạng thái, không cho kéo thả.

## 4. Hooks

```ts
export const defenseScheduleKeys = {
  all: ['lecturer', 'defense-schedule'] as const,
  council: (councilPublicId: string) => [...defenseScheduleKeys.all, councilPublicId] as const,
}
```
- `useCouncilDefenseSchedule(councilPublicId?)`: `useQuery`, `skipToken` khi chưa có id.
- `useScheduleDefenseSlot(councilPublicId)` / `useUnscheduleDefenseSlot(councilPublicId)`: `useMutation`, `onSuccess` → `toast.success(...)` + invalidate `defenseScheduleKeys.council(id)` **và** `examinerReviewKeys.board(id)` (vì trạng thái SV đổi sang SCHEDULED, tab phân công cũng phải khóa).

## 5. Giao diện `DefenseScheduleBoard`

**Thanh thông tin trên cùng**
- Khung lịch Hội đồng `defenseStartTime – defenseEndTime`, phòng mặc định `location`, mốc tổ chức bảo vệ `deadlineStartAt – deadlineEndAt`.
- Nếu `deadlineStartAt == null`: banner vàng "Ngành chưa thiết lập mốc Thời gian tổ chức Hội đồng bảo vệ – chưa thể xếp ca".
- `canSchedule = false` → badge "Chế độ chỉ đọc", ẩn mọi nút thao tác.
- Thống kê: tổng SV / chưa xếp ca (`READY_FOR_DEFENSE`) / đã xếp ca (`SCHEDULED`).

**Cột trái – danh sách sinh viên**: lọc Tất cả / Chưa xếp ca / Đã xếp ca; mỗi dòng: MSSV, tên, đề tài, GVHD, điểm PB, badge trạng thái (`Chưa xếp ca` / `Ca số N · HH:mm`). Kéo thả được khi `canSchedule`.

**Cột phải – các khối ca (chỉ là nhóm hiển thị ở FE, BE KHÔNG lưu khái niệm "ca sáng/chiều")**
- Mặc định 3 khối trong **ngày bảo vệ** (lấy ngày của `defenseStartTime` Hội đồng): Ca Sáng 07:30–11:30, Ca Chiều 13:30–17:30, Ca Tối 18:00–21:00. Nếu Hội đồng kéo dài nhiều ngày thì tạo khối cho từng ngày. Cho phép thêm / sửa / xóa khối (lưu ở Zustand `store/`, chỉ là trạng thái giao diện).
- Sinh viên đã xếp ca được đặt vào khối chứa `defenseStartTime` của họ; sắp theo `slotOrder`. Hiển thị `Ca số N · HH:mm – HH:mm · phòng`.
- **Kéo SV vào khối** (hoặc chọn nhiều SV rồi bấm "Xếp vào ca..."): FE tự tính giờ nối tiếp từ cuối ca cuối cùng đang có trong khối, mỗi SV mặc định **30 phút** (cho chỉnh ở 1 ô "Thời lượng mỗi SV"), `slotOrder` = số lớn nhất hiện có trong Hội đồng + 1, `room` = `location` Hội đồng. Gọi `PUT .../defense-slot` **tuần tự** từng SV (không `Promise.all`, tránh BE báo chồng lấn khi chạy song song); dừng ở SV đầu tiên lỗi và hiện lỗi đó; cuối cùng invalidate 1 lần.
- **Bấm 1 SV đã xếp** → mở `ScheduleDefenseSlotDialog` để sửa tay.
- **Nút gỡ (X) trên SV** (khi `canUnschedule`) → confirm → `DELETE .../defense-slot`.
- **"Đặt lại lịch"**: confirm, rồi gọi DELETE tuần tự cho mọi SV có `canUnschedule`.

**`ScheduleDefenseSlotDialog`** (react-hook-form + zod, `<form noValidate>`):
- Field: Số thứ tự ca (số nguyên ≥ 1), Ngày bảo vệ, Giờ bắt đầu, Giờ kết thúc, Phòng (placeholder = `location` Hội đồng, để trống thì dùng phòng mặc định).
- Validate FE (chỉ để báo sớm, BE vẫn là nguồn đúng): giờ bắt đầu < giờ kết thúc; nằm trong mốc `deadlineStartAt–deadlineEndAt` và khung `defenseStartTime–defenseEndTime` của Hội đồng; slotOrder không trùng SV khác; không chồng giờ SV khác (ca liền kề, ví dụ 08:00–08:30 và 08:30–09:00, là hợp lệ).
- Nút "Lưu ca bảo vệ" `disabled={isPending}`, chữ "Đang lưu...". Lỗi BE hiện ngay trong dialog.

## 6. Mã lỗi backend cần xử lý (hiện `message` BE trả về)

| code | Ý nghĩa |
|---|---|
| 3119 `COUNCIL_ROLE_FORBIDDEN` | Không phải CT/TK của Hội đồng |
| 3121 `COUNCIL_NOT_PUBLISHED` | Hội đồng chưa công bố |
| 3138 `DEFENSE_SLOT_NOT_ELIGIBLE` | SV chưa đạt phản biện / đã bảo vệ xong |
| 3139 `DEFENSE_SLOT_TIME_INVALID` | Giờ bắt đầu ≥ giờ kết thúc |
| 3140 `DEFENSE_SLOT_OUT_OF_DEADLINE` | Ngoài mốc tổ chức Hội đồng bảo vệ |
| 3141 `DEFENSE_SLOT_OUT_OF_COUNCIL_TIME` | Ngoài khung lịch Hội đồng |
| 3142 `DEFENSE_SLOT_OVERLAP` | Chồng giờ với SV khác |
| 3143 `DEFENSE_SLOT_ORDER_DUPLICATE` | Trùng số thứ tự ca |
| 3144 `DEFENSE_SLOT_NOT_SCHEDULED` | Gỡ ca nhưng SV chưa được xếp |
| 3145 `DEFENSE_ROOM_REQUIRED` | Không có phòng và Hội đồng không có phòng mặc định |
| 3112 `DEFENSE_ASSIGNMENT_CANNOT_REMOVE` | Không gỡ được ca vì Hội đồng đã chấm SV này |
| `DEADLINE_NOT_CONFIGURED` | Ngành chưa cấu hình mốc |
| 4000 | Lỗi validate field (thiếu slotOrder, thời gian, phòng > 255 ký tự) |

## 7. Hoàn thành khi

- `npm run build` và `npm run lint` không lỗi; nếu có test cho feature thì `npm run test` xanh.
- Ủy viên mở tab "Lịch bảo vệ" chỉ xem được, không thấy nút thao tác.
- CT/TK kéo SV `READY_FOR_DEFENSE` vào ca → SV chuyển "Ca số N", tab Phân công phản biện của SV đó bị khóa.
- Sửa ca / gỡ ca / đặt lại lịch hoạt động, lỗi BE hiện đúng message tiếng Việt.
- Không dùng mock fallback kiểu `try { api } catch { return mock }`.
