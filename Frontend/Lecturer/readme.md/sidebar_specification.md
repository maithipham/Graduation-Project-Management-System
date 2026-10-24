# TẬP ĐẶC TẢ THIẾT KẾ VÀ GIAO DIỆN SIDEBAR (TLU THESIS UI SPECIFICATION)

> **Mục đích tài liệu:** Cung cấp đầy đủ và chính xác 100% các thông số thiết kế, bảng màu, typography, kích thước, hiệu ứng và mã nguồn mẫu để tái tạo lại giao diện Sidebar đồng bộ chuẩn xác.

---

## 1. Công nghệ & Thư viện phụ thuộc (Tech Stack)
* **CSS Framework:** [Tailwind CSS v3](https://cdn.tailwindcss.com) (kèm custom colors & font config).
* **Font chữ (Google Fonts):** `Inter` (weights: `400`, `500`, `600`, `700`, `800`).
* **Bộ Icon:** [Lucide Icons](https://lucide.dev/) (CDN: `https://unpkg.com/lucide@latest/dist/umd/lucide.js`).

### Cấu hình Tailwind & Font trong thẻ `<head>`:
```html
<!-- Google Fonts: Inter -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

<!-- Tailwind CSS v3 & Configuration -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ["Inter", "Be Vietnam Pro", "system-ui", "sans-serif"],
        },
        colors: {
          navy: "#0D47A1",
          uni: "#1565C0",
          soft: "#E3F2FD",
        },
      },
    },
  };
</script>
```

---

## 2. Bảng mã màu chuẩn (Design Color Tokens)

| Tên định danh | Giá trị Hex / RGBA | Class Tailwind | Vị trí áp dụng |
| :--- | :--- | :--- | :--- |
| **Primary Blue (Nền chính)** | `#1565C0` | `bg-[#1565C0]` | Toàn bộ nền Sidebar |
| **Border Right (Viền phải)** | `#0D47A1` | `border-[#0D47A1]` | Đường phân cách giữa Sidebar và Content |
| **Border Divider (Kẻ ngang)** | `rgba(255, 255, 255, 0.1)` | `border-white/10` | Kẻ đáy Brand Header và kẻ đỉnh Footer |
| **Text Default (Menu cấp 1)** | `#DBEAFE` | `text-blue-100` | Chữ menu chính chưa kích hoạt |
| **Text Muted (Menu phụ & Sub)** | `#BFDBFE` | `text-blue-200` | Chữ menu con cấp 2 và phụ đề Brand |
| **Text / Icon Hover & Active** | `#FFFFFF` | `text-white` | Màu chữ và icon khi hover hoặc active |
| **Item Hover Background** | `rgba(255, 255, 255, 0.1)` | `hover:bg-white/10` | Nền khi rê chuột vào item |
| **Item Active Background** | `rgba(255, 255, 255, 0.18)` | `.active` | Nền nút đang chọn (như "Giảng viên") |
| **Active Indicator (Vạch chỉ)** | `#FFFFFF` | `.active::before` | Vạch trắng dọc bên mép trái menu active |
| **Kbd Badge Background** | `rgba(255, 255, 255, 0.1)` | `bg-white/10` | Nền phím tắt Ctrl B ở Footer |
| **Copyright / Version Text** | `rgba(191, 219, 254, 0.5)` | `text-blue-200/50` | Thông tin phiên bản ở chân sidebar |

---

## 3. Typography & Chi tiết thông số chữ (Font Specifications)

* **Font-family chung:** `"Inter", "Be Vietnam Pro", system-ui, -apple-system, sans-serif`

| Phần tử hiển thị | Font Size | Font Weight | Line Height / Tracking | Màu chữ |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Title:** `"TLU THESIS"` | `13.5px` (`text-[13.5px]`) | Bold (`700`) | `tracking-tight` (-0.025em) | `#FFFFFF` |
| **Brand Subtitle:** `"TRƯỞNG BỘ MÔN"` | `10.5px` (`text-[10.5px]`) | Medium (`500`) | `tracking-wide` (+0.025em) | `#BFDBFE` (`text-blue-200`) |
| **Menu cấp 1 (Mặc định)** | `13px` (`text-[13px]`) | Medium (`500`) | Normal | `#DBEAFE` (`text-blue-100`) |
| **Menu cấp 1 (Active)** | `13px` (`text-[13px]`) | Semi-bold (`600`) | Normal | `#FFFFFF` |
| **Menu con cấp 2 (Mặc định)** | `12.5px` (`text-[12.5px]`) | Medium (`500`) | Normal | `#BFDBFE` (`text-blue-200`) |
| **Menu con cấp 2 (Active)** | `12.5px` (`text-[12.5px]`) | Semi-bold (`600`) | Normal | `#FFFFFF` |
| **Nút "Thu gọn menu"** | `13px` (`text-[13px]`) | Medium (`500`) | `tracking-wide` | `#DBEAFE` (Hover: `#FFFFFF`) |
| **Phím tắt `Ctrl B`** | `10px` (`text-[10px]`) | Semi-bold (`600`) | Normal | `rgba(191, 219, 254, 0.9)` |
| **Phiên bản & Copyright** | `10.5px` (`text-[10.5px]`) | Regular (`400`) | Normal | `rgba(191, 219, 254, 0.5)` |

---

## 4. Kích thước & Khoảng cách (Layout & Spacing)

### A. Kích thước tổng thể Sidebar:
* **Chiều rộng khi Mở (Expanded):** `260px` (`w-[260px]`).
* **Chiều rộng khi Thu gọn (Collapsed):** `72px` (`width: 72px`).
* **Vị trí cố định:** `fixed inset-y-0 left-0 z-40 flex flex-col`.
* **Đường viền phải:** `border-r border-[#0D47A1]`.

### B. Brand / Header Sidebar:
* Chiều cao: `64px` (`h-16`).
* Padding: `px-5` (20px).
* Box Logo Icon:
  * Kích thước: `36px × 36px` (`w-9 h-9`).
  * Bo góc: `rounded-lg` (8px).
  * Nền: `bg-white/15` kèm viền `border border-white/20`.
  * Icon `graduation-cap`: `20px × 20px` (`w-5 h-5`).

### C. Danh sách Menu (Navigation List):
* Padding ngoài: `py-3 px-3` (12px dọc và ngang).
* Khoảng cách giữa các nhóm menu: `space-y-4` (16px).
* **Menu cấp 1 (`nav-item` / `sb-item`):**
  * Chiều cao: `40px` (`h-10`).
  * Padding: `px-3` (12px).
  * Khoảng cách icon và chữ: `gap-3` (12px).
  * Bo góc: `rounded-lg` (8px).
  * Kích thước icon: `18px × 18px` (`w-[18px] h-[18px]`).
* **Accordion (Submenu - Quản lý phân công):**
  * Thụt lề trái: `pl-3` (12px).
  * Khoảng cách giữa các mục con: `space-y-0.5` (2px).
* **Menu con cấp 2 (`nav-sub`):**
  * Chiều cao: `36px` (`h-9`).
  * Padding: `pl-6 pr-3` (trái 24px, phải 12px).
  * Khoảng cách icon và chữ: `gap-3` (12px).
  * Bo góc: `rounded-lg` (8px).
  * Kích thước icon: `16px × 16px` (`w-[16px] h-[16px]`).

### D. Footer:
* Padding: `p-3` (12px), đường viền đỉnh: `border-t border-white/10`.
* Nút "Thu gọn menu": Chiều cao `40px` (`h-10`), bo góc `12px` (`rounded-xl`), padding `px-3`.
* Hộp icon thu gọn: `28px × 28px` (`w-7 h-7`), bo góc `rounded-lg` (8px), icon `16px × 16px`.
* Phím tắt `Ctrl B`: padding `px-1.5 py-0.5`, viền `border border-white/20`, bo góc `rounded` (4px).

---


