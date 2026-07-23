# TổThế PWA — Đặc tả thiết kế

## Nguồn yêu cầu

Tài liệu này chuẩn hóa `MASTER_PROMPT.md` thành đặc tả triển khai. Khi có khác biệt, `MASTER_PROMPT.md` là nguồn sự thật.

## Mục tiêu

Xây dựng PWA mobile-first cho tổ trưởng chuyên môn phân công giáo viên dạy thay. Người dùng chỉ chọn giáo viên vắng và ngày nghỉ; hệ thống lấy các tiết cần thế, lọc ứng viên hợp lệ, xếp hạng theo cân bằng thừa giờ và hỗ trợ lưu, chia sẻ, báo cáo.

## Kiến trúc

- React 18 + Vite, React Router cho các màn hình, Tailwind CSS 3 cho giao diện.
- Zustand quản lý trạng thái ứng dụng.
- Service layer thống nhất cho giáo viên, đợt TKB, thời khóa biểu, ngoại lệ và phân công.
- localStorage là adapter mặc định để bản demo chạy không cần tài khoản; Supabase là adapter production được bật bằng biến môi trường.
- Scoring engine là module thuần, độc lập UI và được kiểm thử đơn vị.
- vite-plugin-pwa tạo manifest, service worker tự cập nhật và cache runtime Supabase.

## Thành phần và luồng dữ liệu

1. Khi khởi động, service layer seed dữ liệu nếu storage trống rồi store tải snapshot.
2. Luồng phân công nhận giáo viên vắng và ngày, tìm đợt TKB hiệu lực, lấy tất cả tiết của giáo viên trong ngày.
3. Mỗi tiết được scoring engine lọc cứng và xếp hạng; người dùng chọn ứng viên riêng cho từng tiết hoặc lưu trạng thái chưa phân công.
4. Khi xác nhận, các bản ghi được lưu kèm `period_id`, học kỳ và năm học để lịch sử không mất khi đổi TKB.
5. Màn hình lịch sử tổng hợp số tiết chuẩn, tiết thế, tổng và thừa/thiếu; hỗ trợ lọc và xuất Excel/PDF.

## Quy tắc nghiệp vụ

- Loại giáo viên vắng, sai môn, đang bị khóa, hoặc bận đúng tiết.
- Điểm cuối: 60% cân bằng thừa giờ, 30% tối ưu lịch trong ngày, 10% số lần thế trong tuần.
- Chênh lệch max-min trên 5 tiết cảnh báo vàng; trên 10 tiết cảnh báo đỏ và gợi ý.
- Ngoại lệ tự hết hiệu lực sau `den_ngay`.
- Không có ứng viên hợp lệ thì cho phép lưu “Chưa phân công” kèm ghi chú.
- Mỗi tiết vắng có thể chọn một giáo viên thay khác nhau.

## Giao diện

- Điều hướng mobile-first: Tổng quan, Phân công, Lịch sử, Thiết lập.
- Màu chính `#1e40af`, thành công `#16a34a`, cảnh báo `#d97706`, nguy hiểm `#dc2626`, nền `#f8fafc`, chữ `#0f172a`.
- CandidateCard thể hiện hạng, thừa giờ, lịch liền kề, lý do và trạng thái được chọn.
- Các màn thiết lập quản lý giáo viên/phân công chuyên môn, đợt TKB, TKB nhập tay/import Excel và ngoại lệ.

## Xử lý lỗi

- Dữ liệu nhập được kiểm tra bắt buộc, khoảng ngày, số thứ/tiết và trùng lịch.
- Lỗi import hiển thị số dòng và nguyên nhân; dữ liệu hợp lệ chỉ được lưu sau khi người dùng xác nhận.
- Lỗi storage/export/share có thông báo rõ và không làm mất trạng thái form.
- Adapter Supabase thiếu cấu hình tự dùng localStorage; lỗi kết nối được báo mà không ghi đè dữ liệu local.

## Kiểm thử và tiêu chí hoàn tất

- Unit test scoring engine bao phủ bốn case bắt buộc trong master prompt, tính tuần, khóa theo ngày và cảnh báo mất cân bằng.
- Unit test services bao phủ seed, CRUD, đợt hiệu lực, lịch sử qua nhiều đợt và tổng hợp báo cáo.
- Component/integration test bao phủ luồng phân công ba bước và trạng thái không có ứng viên.
- Mỗi sprint phải đạt test, lint và production build trước khi chuyển tiếp.
- Cuối cùng chạy toàn bộ test, lint, build và kiểm tra PWA artifact.

## Phạm vi production

Triển khai adapter Supabase, SQL schema, `.env.example`, PWA và cấu hình hosting. Vì thông tin Supabase không có trong prompt, bản deploy mặc định dùng localStorage nhưng sẵn sàng chuyển adapter bằng biến môi trường.
