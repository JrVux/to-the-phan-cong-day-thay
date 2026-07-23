# TổThế — Phân công dạy thay

PWA mobile-first cho tổ trưởng chuyên môn: chọn giáo viên vắng và ngày nghỉ, hệ thống tự lấy các tiết cần thế, lọc ứng viên, xếp hạng theo cân bằng thừa giờ và lưu lịch sử xuyên suốt nhiều đợt TKB.

## Chạy trên máy

Yêu cầu Node.js 20+ và pnpm.

```bash
pnpm install
pnpm dev
```

Ứng dụng tự seed dữ liệu mẫu vào `localStorage`. Không cần tài khoản hoặc backend để dùng bản demo.

## Kiểm tra

```bash
pnpm test:run
pnpm lint
pnpm build
```

Sau build, `dist/` phải có `manifest.webmanifest`, `sw.js`, icon 192/512 và toàn bộ static assets.

## Kết nối Supabase

1. Tạo project Supabase.
2. Chạy [supabase/schema.sql](./supabase/schema.sql) trong SQL Editor.
3. Sao chép `.env.example` thành `.env.local`.
4. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
5. Chạy lại ứng dụng.

Adapter hoạt động theo mô hình local-first: UI đọc/ghi cache trên thiết bị ngay lập tức, đồng thời tải và mirror dữ liệu với Supabase. Khi mất mạng, người dùng vẫn thao tác được; dữ liệu local không bị mất.

> Policy trong schema cho phép anon đọc/ghi để phù hợp yêu cầu một người dùng, không đăng nhập. Với dữ liệu trường học thật, hãy bật Supabase Auth và giới hạn policy theo tài khoản tổ trưởng.

## File import TKB

Hỗ trợ `.xlsx`, `.xls`, `.csv`. Dòng tiêu đề chấp nhận:

- `Giáo viên` hoặc `Mã GV`
- `Thứ` (2–7)
- `Tiết` (1–10)
- `Lớp`
- `Môn`

Ứng dụng kiểm tra dữ liệu và hiển thị preview trước khi lưu.

## Cài PWA

Mở bản HTTPS trên Chrome/Edge/Safari, chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”. Service worker tự cập nhật và dùng chiến lược Network First cho Supabase.
