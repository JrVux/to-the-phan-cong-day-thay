# HƯỚNG DẪN SỬ DỤNG

Hệ thống **Phân công dạy thay** của Tổ Tin - Thể dục - GDQP dành cho tổ trưởng chuyên môn. Phần mềm chạy trên điện thoại và máy tính, cài được thành ứng dụng (PWA), dùng được cả khi mất mạng.

---

## 1. Bắt đầu

### 1.1 Mở và cài ứng dụng trên điện thoại

1. Mở trình duyệt Chrome (Android) hoặc Safari (iPhone) đến địa chỉ:
   `https://jrvux.github.io/to-the-phan-cong-day-thay/`
2. Chọn **Cài đặt ứng dụng** (Chrome) hoặc **Chia sẻ → Thêm vào màn hình chính** (Safari).
3. Mở app từ màn hình chính như một ứng dụng bình thường. Dùng offline vẫn được.

### 1.2 Cấu trúc màn hình

Thanh điều hướng có 4 mục:

| Mục | Chức năng |
|---|---|
| **Tổng quan** | Số liệu GV, tiết thế trong tháng, chưa phân công, ngoại lệ + phân công gần đây |
| **Phân công** | Tác vụ chính: tạo phân công dạy thay |
| **Lịch sử** | Lịch sử phân công, báo cáo cân bằng tiết chuẩn, xuất Excel/PDF |
| **Thiết lập** | Giáo viên, đợt TKB, thời khóa biểu, ngoại lệ, năm mới |

---

## 2. Phân công dạy thay (tác vụ chính)

Chỉ cần **2 thao tác**, phần còn lại hệ thống tự làm:

### Bước 1 — Chọn giáo viên vắng và ngày nghỉ
- Chọn **Giáo viên vắng** trong danh sách.
- Chọn **Ngày nghỉ**.
- Nhấn **Tìm tiết cần thế**.

### Bước 2 — Chọn người thế
- Hệ thống liệt kê tất cả tiết cần bố trí của GV vắng trong ngày đó.
- **Tiết chào cờ thứ 2** (Sáng T1 và Chiều T5) được tự động bỏ qua — không tìm GV thế.
- Mỗi tiết hiển thị **top 3 ứng viên** kèm:
  - Lý do: thiếu/thừa tiết chuẩn, tiết liền kề, đã thế bao nhiêu tiết hôm nay.
  - **TKB hôm nay** của ứng viên (buổi, tiết, môn, lớp) — giúp chọn đúng người rảnh.
  - Phía trên mỗi tiết còn hiện **TKB gọn của GV nghỉ** để đối chiếu.
- Nhấn **Chọn giáo viên** trên thẻ ứng viên muốn dùng.
- Có thể nhấn **Tự chọn phân công tối ưu nhất** để hệ thống gán 1 lớp 1 GV thế, dạy liên tiếp, ưu tiên GV thiếu tiết chuẩn nhất.
- Nếu không có ứng viên hợp lệ, phần mềm báo để **xử lý thủ công** (ghi chú, vẫn có thể lưu "chưa phân công").

### Bước 3 — Xác nhận và lưu
- Xem lại toàn bộ phân công → **Lưu phân công**.
- Sau khi lưu có thể **Xuất báo cáo PDF** (phiếu phân công gửi tổ) hoặc **Chia sẻ kết quả** (Zalo/SMS) hoặc **Tạo phân công khác**.

> **Quy định hệ thống tự kiểm tra:** mỗi GV thế tối đa 3 tiết/ngày, 3 tiết/tuần, 4 tiết/buổi và tổng dạy + thế không quá 6 tiết/ngày. Nếu ứng viên vượt giới hạn, hệ thống **vẫn cho chọn** nhưng thẻ có cảnh báo đỏ **"Vi phạm giới hạn"** kèm chi tiết lý do; khi lưu phần mềm nhắc lại tên người vi phạm để tổ trưởng chủ động quyết định.

---

## 3. Lịch sử & Báo cáo

- **Bộ lọc:** chọn học kỳ, giáo viên, tháng để xem đúng phần cần.
- **Tổng hợp cân bằng tiết chuẩn:** bảng từng GV với **Tiết chuẩn**, **Tiết/tuần** (đã cộng phụ cấp chủ nhiệm +4), **Số tiết thế**, **Số tuần đã qua** và **Thừa/Thiếu**. Cảnh báo vàng/đỏ khi chênh lệch lớn.
- **Cách đọc cột Thừa/Thiếu:** đây là **tổng cộng dồn cho cả đợt/học kỳ**, không phải của 1 tuần. Ví dụ GV chuẩn 15 mà dạy 9 tiết/tuần thì mỗi tuần thiếu 6; sau 3,5 tuần cộng dồn ra **Thiếu 21**. Cột **Số tuần qua** giúp đối chiếu con số này.
- **Xuất báo cáo:**
  - **Xuất Excel** — số liệu thô (gồm cả cột Số tuần qua).
  - **Xuất PDF** — hồ sơ tổ.
  - **Xuất PDF theo từng GV vắng** — mỗi GV nghỉ trong kỳ được tạo **1 file PDF riêng**, toàn bộ tiết cần bố trí gom vào **một bảng trên 1 trang**, xếp theo **thứ trong tuần tăng dần** (Thứ 2 → Chủ nhật) kèm ngày, GV dạy thế và khối chữ ký.
- **Chi tiết lịch sử:** hiển thị **một bảng gọn** gồm Ngày, Tiết dạy, Lớp/Môn, GV vắng, GV dạy thế, trạng thái, học kỳ — xếp **tăng dần theo ngày và thứ** để dễ dò lại. Nút **xóa** (xác nhận) khi phân nhầm.

---

## 4. Thiết lập hệ thống

### 4.1 Giáo viên
- **Thêm GV:** nhấn **+ Thêm GV**, nhập họ tên, chọn môn dạy (Tin học, Giáo dục thể chất, GDQP AN, HĐTN-HN), đánh dấu đang hoạt động.
- **Sửa / Tạm ẩn:** nhấn bút chì trên thẻ GV.
- **Phân công chuyên môn:** bảng dưới cùng để chỉnh theo từng đợt:
  - Môn chính thức, **tiết chuẩn** (mặc định 17).
  - **Kiêm nhiệm** (tối đa 2): Chủ nhiệm (+4 tiết/tuần), Tổ trưởng (−3), Tổ phó (−1), TTND (−2), TTCĐ (−3), TPCĐ (−1), KTPM Tin (−2), Phó BTĐ (chuẩn 8,5), Bí thư Đoàn (chuẩn 2,5).
  - Danh sách **Lớp** (phân cách bằng dấu phẩy) — nhấn Enter để lưu.

### 4.2 Đợt TKB
- Tạo đợt mới (tên, năm học, từ ngày → đến ngày, học kỳ) khi đổi TKB.
- **Đặt làm đợt hiện tại** để dùng mặc định.
- Dữ liệu đợt cũ luôn được giữ nguyên, không mất lịch sử.

### 4.3 Thời khóa biểu
- Chọn đợt TKB.
- **Import Excel:** nhấn **Import Excel**, chọn file `.xlsx/.xls/.csv`. Cột phải có: `Giáo viên` (hoặc `Mã GV`), `Thứ` (2–7), `Tiết` (1–10), `Lớp`, `Môn`. Xem trước → **Xác nhận import**.
- **Nhập một dòng:** thêm thủ công từng dòng.
- **Lưới TKB:** bảng thứ × buổi × tiết của toàn tổ (kèm lớp), cột cuối là tổng tiết.
- **Cập nhật phân công từ TKB:** tự đồng bộ số tiết/tuần và lớp vào bảng phân công chuyên môn.
- Lưu ý: tạo đợt TKB mới trước khi import TKB mới, để không đè dữ liệu cũ.

### 4.4 Ngoại lệ giáo viên
- Dùng cho GV nghỉ dài ngày, kiêm nhiệm BGH… — những người này **không được gợi ý dạy thế**.
- Thêm: chọn GV, từ ngày → đến ngày, ghi lý do. Tự hết hiệu lực khi quá ngày kết thúc.

### 4.5 Năm mới
Dùng cuối năm học để chuẩn bị dữ liệu cho năm học mới:
- **Bắt đầu năm học mới:** xóa lịch sử dạy thay, thời khóa biểu, phân công chuyên môn và ngoại lệ của năm cũ; **giữ nguyên danh sách giáo viên**. Gõ `XÁC NHẬN` rồi bấm xác nhận. Sau đó tạo đợt TKB mới (năm học mới, từ ngày → đến ngày) trong **4.2 Đợt TKB** và import TKB mới.
- **Xóa toàn bộ dữ liệu:** khôi phục về dữ liệu mẫu ban đầu (dùng khi chạy thử hoặc làm lại từ đầu).

> Gợi ý trình tự sang năm học mới: (1) **Thiết lập → Năm mới → Bắt đầu năm học mới** → (2) tạo **Đợt TKB** mới cho năm học → (3) **Thời khóa biểu → Import Excel** TKB mới.

---

## 5. Mẹo dùng trên điện thoại

- **Bảng rộng** (TKB, phân công chuyên môn, báo cáo) cuộn ngang được; cột "Giáo viên" và dòng tiêu đề luôn cố định khi cuộn.
- **Cài làm ứng dụng** để có màn hình riêng, không bị thanh trình duyệt che.
- Mất mạng vẫn thao tác được; dữ liệu được lưu ngay trên máy.

---

## 6. Khắc phục nhanh

| Tình huống | Cách xử lý |
|---|---|
| Báo "Không có đợt TKB hiệu lực" | Kiểm tra **Thiết lập → Đợt TKB**, đảm bảo ngày chọn nằm trong khoảng từ/đến của một đợt và đã có TKB trong đợt. |
| Báo "Giáo viên không có tiết dạy trong ngày này" | GV vắng ngày đó không có tiết theo TKB (hoặc chỉ có tiết chào cờ). Chọn ngày khác. |
| Ứng viên có cảnh báo "Vi phạm giới hạn" | GV đó đã chạm tối đa 3 thế/ngày, 3/tuần, 4/buổi hoặc 6 tiết/ngày. Vẫn **chọn được** nếu tổ trưởng chấp nhận; thẻ sẽ ghi rõ lý do và khi lưu hệ thống nhắc lại. |
| Không tìm được GV thay | Toàn bộ GV cùng môn vắng/bị khóa hoặc trùng tiết đúng (thu, tiết) đó. Xử lý thủ công + ghi chú. |
| Chưa phân công được vẫn lưu | Được phép: ghi chú lý do và lưu trạng thái "Chưa phân công" để theo dõi sau. |
| Phân nhầm người | Vào **Lịch sử**, nhấn nút xóa trên bản ghi (có xác nhận), tạo lại phân công. |
| Thấy "Thừa/Thiếu" lớn hơn chênh lệch 1 tuần | Đây là **tổng cộng dồn** qua các đợt (nhân với số tuần). Xem cột **Số tuần qua** để đối chiếu. |
| Đổi sang năm học mới | **Thiết lập → Năm mới → Bắt đầu năm học mới**, rồi tạo Đợt TKB mới và import TKB. |
| Dữ liệu không đúng môn/tiết chuẩn | Vào **Thiết lập → Giáo viên** chỉnh phân công chuyên môn; hoặc **Thiết lập → Thời khóa biểu → Cập nhật phân công từ TKB**. |
