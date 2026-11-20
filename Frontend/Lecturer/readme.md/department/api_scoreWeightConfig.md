# Cấu hình điểm – Trọng số điểm tổng kết (Trưởng bộ môn) – ĐÃ GỠ BỎ

> **Nghiệp vụ mới: hệ thống không còn cấu hình trọng số 3 đầu điểm (Hướng dẫn / Phản biện / Hội đồng).**
> Backend (`tlu_gpms_system`) đã xóa toàn bộ feature `ScoreWeightConfig` cùng 9 API `/score-weight-config`.
> File này giữ lại để FE biết cần gỡ gì. Quy ước chung (wrapper response, interceptor, toast) giống Mục 3 của `api_addStudent.md`.

---

## 1. Cách tính điểm tổng kết hiện tại

- **Điểm tổng kết** = **trung bình cộng** điểm cá nhân của giáo viên hướng dẫn, 2 cán bộ phản biện và các thành viên
  hội đồng bảo vệ (QĐ1305 – Điều 9.1). Không có trọng số, Trưởng bộ môn không cấu hình gì.
- BE tự tính khi đủ phiếu ở phần bảo vệ. Chưa có kết quả bảo vệ → `finalScore = null` ("Chưa có điểm").
- **Trọng số tiêu chí trong rubric vẫn giữ nguyên** (tổng 100%, xem `api_rubricConfig.md`). Chỉ bỏ trọng số 3 đầu điểm.

---

## 2. API đã xóa

Gọi các API dưới đây BE trả **404 / `code` 1005** (`RESOURCE_NOT_FOUND`).

| Mã cũ | Method | Endpoint                                                  |
| :---- | :----- | :-------------------------------------------------------- |
| W1    | GET    | `/score-weight-config`                                    |
| W2    | GET    | `/score-weight-config/{publicId}`                         |
| W3    | POST   | `/score-weight-config`                                    |
| W4    | PUT    | `/score-weight-config/{publicId}`                         |
| W5    | DELETE | `/score-weight-config/{publicId}`                         |
| W6    | GET    | `/score-weight-config/{publicId}/apply-preview`           |
| W6b   | GET    | `/score-weight-config/{publicId}/cancel-apply-preview`    |
| W7    | POST   | `/score-weight-config/{publicId}/apply`                   |
| W8    | PATCH  | `/score-weight-config/{publicId}/semester-range`          |
| W9    | POST   | `/score-weight-config/{publicId}/cancel-apply`            |

Các mã lỗi riêng của cấu hình trọng số (khóa `SCORE_WEIGHT_*`, bảng lỗi 31xx và 4000 cũ của file này) cũng đã bị xóa,
FE không cần xử lý nữa. Các mã lỗi của rubric không đổi.

---

## 3. API điểm sinh viên thay đổi

`GET /thesis-score/my-score?semesterId=` (role `STUDENT`) **bỏ 4 field**: `advisorWeight`, `examinerWeight`,
`councilWeight`, `weightConfigured`. Response hiện tại:

```json
{
  "code": 1000,
  "data": {
    "semesterPublicId": "0193a000-0000-7000-8000-000000000101",
    "semesterName": "Học kỳ 1 năm học 2026-2027",
    "topicPublicId": "0195f3a2-1c4b-7d10-9a01-000000000010",
    "topicName": "Hệ thống quản lý đồ án",
    "advisorScore": 8.5,
    "examinerScore": 8.8,
    "examinerPassed": true,
    "councilScore": null,
    "finalScore": null
  }
}
```

| Field            | Ý nghĩa                                                                  |
| :--------------- | :----------------------------------------------------------------------- |
| `advisorScore`   | Điểm Hướng dẫn; `null` = chưa có                                         |
| `examinerScore`  | Điểm Phản biện (trung bình 2 phiếu); `null` khi chưa đủ 2 phiếu          |
| `examinerPassed` | `true` nếu Điểm Phản biện ≥ 5.0; `null` khi chưa đủ phiếu                |
| `councilScore`   | Điểm Hội đồng; `null` khi chưa đủ phiếu                                  |
| `finalScore`     | Điểm tổng kết theo QĐ1305; `null` = "Chưa có điểm"                       |

Màn điểm sinh viên **không hiện trọng số** và bỏ câu "Chưa có cấu hình trọng số, chưa tính điểm tổng kết".

---

## 4. Việc FE cần làm

Màn "Cấu hình điểm" quay về **3 tab rubric** (Hướng dẫn / Phản biện / Hội đồng), bỏ tab "Trọng số tổng kết".

Gỡ trong `src/features/department/score_management/`:

| File                                   | Việc cần làm                                              |
| :------------------------------------- | :-------------------------------------------------------- |
| `components/ScoreWeightPanel.tsx`      | Xóa                                                       |
| `components/ScoreWeightTable.tsx`      | Xóa                                                       |
| `components/ScoreWeightFormDialog.tsx` | Xóa                                                       |
| `components/ApplyScoreWeightDialog.tsx`| Xóa                                                       |
| `hooks/useScoreWeights.ts`             | Xóa                                                       |
| `services/scoreWeight.service.ts`      | Xóa                                                       |
| `utils/scoreWeightSchema.ts`           | Xóa                                                       |
| `utils/scoreWeightErrors.ts`           | Xóa                                                       |
| `types.ts`                             | Bỏ các type `ScoreWeight*`, giữ type dùng chung của rubric |
| `pages/GradingConfigPage.tsx` (và `GradingConfigTabs.tsx` nếu có) | Bỏ tab thứ 4                  |

Ngoài thư mục trên:

- `src/shared/api/endpoints.ts`: xóa nhóm `departmentScoreWeight`.
- Màn điểm sinh viên (nếu đã làm): bỏ phần hiển thị trọng số và nhánh `weightConfigured`.
- Xóa cache query key `['department', 'score-weight', ...]` nếu còn chỗ khác dùng.
