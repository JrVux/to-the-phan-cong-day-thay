# Phân công dạy thay — Tổ Tin - Thể dục - GDQP

PWA **mobile-first** dành cho tổ trưởng chuyên môn. Khi có giáo viên vắng, chỉ cần chọn **tên giáo viên** và **ngày nghỉ**, hệ thống tự lấy toàn bộ tiết cần thế, lọc và xếp hạng ứng viên theo cân bằng tiết chuẩn trong tổ, rồi lưu lịch sử xuyên suốt nhiều đợt TKB.

- **Demo đang chạy:** https://jrvux.github.io/to-the-phan-cong-day-thay/
- **Cài đặt trên điện thoại:** mở bằng Chrome/Edge/Safari → "Cài đặt ứng dụng" / "Thêm vào màn hình chính". Dùng offline được.

---

## Tính năng

- **Phân công dạy thay 3 bước:** chọn GV vắng + ngày → hệ thống tìm các tiết cần bố trí (tự bỏ qua tiết chào cờ thứ 2) → chọn người thế, xác nhận, lưu.
- **Đề xuất thông minh:** mỗi tiết hiện top 3 ứng viên kèm lý do (thiếu/thừa tiết chuẩn, tiết liền kề, số tiết thế trong tuần/ngày) và **TKB ngày hôm đó** của từng ứng viên + TKB gọn của GV nghỉ.
- **Tự chọn phân công tối ưu nhất:** 1 lớp 1 GV thế, dạy liên tiếp; ưu tiên GV đang thiếu tiết chuẩn nhất.
- **Lịch sử & báo cáo:** bộ lọc học kỳ / giáo viên / tháng, bảng cân bằng tiết chuẩn (có cột **Số tuần qua**), xuất **Excel** và **PDF**; riêng nút **Xuất PDF theo từng GV vắng** tạo mỗi GV nghỉ 1 file, gom toàn bộ tiết vào 1 trang xếp theo thứ trong tuần.
- **Thiết lập dữ liệu:** quản lý giáo viên (môn dạy, kiêm nhiệm, tiết chuẩn, lớp), đợt TKB, nhập **Excel TKB** (tự nhận diện cột Giáo viên/Thứ/Tiết/Lớp/Môn), ngoại lệ khóa giáo viên và **Năm mới** (xóa dữ liệu cũ, giữ giáo viên).
- **PWA offline:** dữ liệu lưu trên thiết bị (localStorage), tự seed dữ liệu mẫu, không cần tài khoản.

### Quy định nghiệp vụ đã áp dụng

| Quy định | Mô tả |
|---|---|
| Tiết chuẩn | 17 tiết/tuần; **Chủ nhiệm +4** tiết/tuần; HĐTN tính **1 tiết**; kiêm nhiệm trừ tiết chuẩn (Tổ trưởng −3, Tổ phó −1, TTND −2, TTCĐ −3, TPCĐ −1, KTPM Tin −2; Phó BTĐ đặt 8,5; Bí thư Đoàn đặt 2,5). |
| Cân bằng | Ưu tiên GV thiếu tiết chuẩn nhất (70%), tối ưu lịch trong buổi (20%), số lần thế trong tuần (10%). Cộng dồn thừa/thiếu qua các đợt TKB. |
| Giới hạn thế | Mỗi GV thế tối đa **3 tiết/ngày**, **3 tiết/tuần**, **4 tiết/buổi** và tổng dạy + thế không quá **6 tiết/ngày**. Vượt giới hạn **vẫn hiển thị và chọn được** nhưng bị cảnh báo đỏ **"Vi phạm giới hạn"** và khi lưu hệ thống nhắc rõ ai đã vi phạm. |
| Chào cờ | Tiết 1 Sáng thứ 2 và Tiết 5 Chiều thứ 2 là chào cờ — không tìm GV thế (vẫn giữ trong TKB và tính khối lượng). |
| Ngoại lệ | GV bị khóa (nghỉ dài ngày, kiêm nhiệm BGH…) tự hết hiệu lực sau ngày kết thúc. |

---

## Hướng dẫn sử dụng

Hướng dẫn chi tiết từng màn hình: [docs/HUONG-DAN-SU-DUNG.md](./docs/HUONG-DAN-SU-DUNG.md) — bản PDF để gửi tổ: [docs/HUONG-DAN-SU-DUNG.pdf](./docs/HUONG-DAN-SU-DUNG.pdf) hoặc trực tuyến: <https://jrvux.github.io/to-the-phan-cong-day-thay/HUONG-DAN-SU-DUNG.pdf>

---

## Chạy trên máy

Yêu cầu Node.js 20+ và pnpm.

```bash
pnpm install
pnpm dev
```

Ứng dụng tự seed dữ liệu mẫu vào `localStorage`. Không cần tài khoản hoặc backend để dùng bản demo.

## Kiểm tra & build

```bash
pnpm test:run   # chạy toàn bộ unit test
pnpm lint       # ESLint (không chấp nhận warning)
pnpm build      # build PWA vào dist/
```

Sau build, `dist/` phải có `manifest.webmanifest`, `sw.js`, icon 192/512 và toàn bộ static assets.

## Triển khai (GitHub Pages)

Repo: **JrVux/to-the-phan-cong-day-thay** — triển khai tự động qua GitHub Actions.

Khi đẩy lên nhánh `main`, workflow [.github/workflows/pages.yml](./.github/workflows/pages.yml): lint → test → build → deploy PWA lên GitHub Pages.

- Địa chỉ: `https://jrvux.github.io/to-the-phan-cong-day-thay/`
- `vite.config.js` đặt `base: './'` để PWA hoạt động trên đường dẫn sub-path của Pages.

> Triển khai thủ công (không qua CI): `pnpm build` rồi tại repo → **Settings → Pages → Build and deployment → Source: GitHub Actions** (workflow đã định sẵn).

## Kết nối Supabase (tùy chọn)

1. Tạo project Supabase.
2. Chạy [supabase/schema.sql](./supabase/schema.sql) trong SQL Editor.
3. Sao chép `.env.example` thành `.env.local`.
4. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
5. Chạy lại ứng dụng.

Adapter hoạt động theo mô hình **local-first**: UI đọc/ghi cache trên thiết bị ngay lập tức, đồng thời tải và mirror dữ liệu với Supabase. Khi mất mạng, người dùng vẫn thao tác được; dữ liệu local không bị mất.

> Policy trong schema cho phép anon đọc/ghi để phù hợp yêu cầu một người dùng, không đăng nhập. Với dữ liệu trường học thật, hãy bật Supabase Auth và giới hạn policy theo tài khoản tổ trưởng.

## File import TKB

Hỗ trợ `.xlsx`, `.xls`, `.csv`. Dòng tiêu đề chấp nhận: `Giáo viên` (hoặc `Mã GV`), `Thứ` (2–7), `Tiết` (1–10), `Lớp`, `Môn`. Ứng dụng kiểm tra dữ liệu và hiển thị preview trước khi lưu.

## Cấu trúc thư mục

```
src/
├── engine/scoringEngine.js    # Thuật toán xếp hạng ứng viên
├── services/                  # DB + nghiệp vụ (TKB, phân công, báo cáo)
├── stores/appStore.js         # Zustand store
├── components/                # UI + CandidateCard
├── pages/                     # Home, Phân công, Lịch sử, Thiết lập lập
└── data/                      # Seed dữ liệu thật
```
