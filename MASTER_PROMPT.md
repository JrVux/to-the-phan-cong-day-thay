# MASTER PROMPT — Hệ thống Phân công Dạy thế (TổThế PWA)

> Dùng prompt này để giao cho bất kỳ AI coding agent nào (Claude Code, Cursor, Copilot...) build toàn bộ ứng dụng từ đầu.

---

## 1. TỔNG QUAN DỰ ÁN

Xây dựng một **Progressive Web App (PWA) mobile-first** tên **PHAN-CONG-DAY-THAY** dành cho tổ trưởng chuyên môn tại trường THPT Việt Nam. Ứng dụng giải quyết bài toán **phân công giáo viên dạy thay** khi có giáo viên vắng, với engine tự động tối ưu hóa việc cân bằng thừa giờ tích lũy trong tổ suốt cả năm học.

**Người dùng duy nhất:** Tổ trưởng chuyên môn (1 người, không cần đăng nhập phức tạp).

**Triết lý thiết kế:** Tổ trưởng chỉ cần làm **2 thao tác** mỗi khi có GV vắng:
1. Chọn tên GV vắng
2. Chọn ngày nghỉ

→ Toàn bộ còn lại do hệ thống tự xử lý và đề xuất.

---

## 2. STACK KỸ THUẬT

```
Frontend:   React 18 + Vite + Tailwind CSS v3
Database:   Supabase (PostgreSQL) — hoặc localStorage cho demo
State:      Zustand
Export:     SheetJS (xlsx) + jsPDF
PWA:        vite-plugin-pwa + Workbox
Icons:      Lucide React
Notify:     Web Share API (chia sẻ kết quả qua Zalo/SMS)
```

**Lưu ý demo:** Nếu chưa có Supabase, dùng `localStorage` + dữ liệu mẫu seed sẵn. Thiết kế service layer (`src/services/`) tách biệt để sau này swap sang Supabase chỉ cần sửa 1 file.

---

## 3. CẤU TRÚC THƯ MỤC

```
src/
├── main.jsx
├── App.jsx
├── data/
│   └── seed.js              # Dữ liệu mẫu (xem Section 8)
├── services/
│   ├── db.js                # Abstraction layer (localStorage hoặc Supabase)
│   ├── scheduleService.js   # CRUD thời khóa biểu, đợt TKB
│   ├── teacherService.js    # CRUD giáo viên, ngoại lệ
│   ├── substitutionService.js # CRUD phân công thế
│   └── reportService.js     # Tổng hợp, xuất báo cáo
├── engine/
│   └── scoringEngine.js     # Thuật toán xếp hạng ứng viên
├── stores/
│   └── appStore.js          # Zustand store
├── components/
│   ├── ui/                  # Button, Card, Badge, Modal, Toast
│   ├── TeacherSelector.jsx
│   ├── DatePicker.jsx
│   ├── CandidateCard.jsx
│   └── WarningBanner.jsx
└── pages/
    ├── Home.jsx             # Dashboard tổng quan
    ├── NewSubstitution.jsx  # Tạo phân công mới
    ├── History.jsx          # Lịch sử + báo cáo
    ├── Setup/
    │   ├── SetupPeriod.jsx  # Quản lý đợt TKB
    │   ├── SetupTeachers.jsx
    │   ├── SetupSchedule.jsx # Import TKB
    │   └── SetupLocks.jsx   # Ngoại lệ GV
    └── Report.jsx           # Xuất báo cáo
```

---

## 4. DATABASE SCHEMA

### 4.1 Bảng `teachers` — Danh sách giáo viên trong tổ
```sql
CREATE TABLE teachers (
  id          TEXT PRIMARY KEY,      -- 'gv_001'
  name        TEXT NOT NULL,         -- 'Nguyễn Văn A'
  mon_day     TEXT[] NOT NULL,       -- ['Toán', 'Tin']
  active      BOOLEAN DEFAULT true
);
```

### 4.2 Bảng `schedule_periods` — Các đợt TKB trong năm
```sql
CREATE TABLE schedule_periods (
  id          TEXT PRIMARY KEY,      -- 'dot_1'
  nam_hoc     TEXT NOT NULL,         -- '2025-2026'
  ten_dot     TEXT NOT NULL,         -- 'Đợt 1 (Khai giảng)'
  tu_ngay     DATE NOT NULL,
  den_ngay    DATE NOT NULL,
  hoc_ky      INTEGER NOT NULL       -- 1 hoặc 2
);
```

### 4.3 Bảng `schedules` — TKB theo từng đợt
```sql
CREATE TABLE schedules (
  id          TEXT PRIMARY KEY,
  period_id   TEXT REFERENCES schedule_periods(id),
  teacher_id  TEXT REFERENCES teachers(id),
  thu         INTEGER NOT NULL,      -- 2=Thứ 2 ... 7=Thứ 7
  tiet        INTEGER NOT NULL,      -- 1..5 (sáng) hoặc 6..10 (chiều)
  lop         TEXT NOT NULL,         -- '10A1'
  mon         TEXT NOT NULL          -- 'Toán'
);
```

### 4.4 Bảng `assignments` — Phân công chuyên môn theo đợt
```sql
CREATE TABLE assignments (
  id          TEXT PRIMARY KEY,
  period_id   TEXT REFERENCES schedule_periods(id),
  teacher_id  TEXT REFERENCES teachers(id),
  mon         TEXT NOT NULL,
  tiet_chuan  INTEGER NOT NULL,      -- số tiết/tuần đợt này (thường 17)
  hoc_ky      INTEGER NOT NULL
);
```

### 4.5 Bảng `teacher_locks` — Ngoại lệ khóa GV
```sql
CREATE TABLE teacher_locks (
  id          TEXT PRIMARY KEY,
  teacher_id  TEXT REFERENCES teachers(id),
  tu_ngay     DATE NOT NULL,
  den_ngay    DATE NOT NULL,
  ly_do       TEXT NOT NULL          -- 'Thai sản', 'Bệnh', 'Kiêm nhiệm BGH'
);
```

### 4.6 Bảng `substitutions` — Lịch sử phân công thế (QUAN TRỌNG NHẤT)
```sql
CREATE TABLE substitutions (
  id              TEXT PRIMARY KEY,
  created_at      TIMESTAMP DEFAULT NOW(),
  period_id       TEXT REFERENCES schedule_periods(id),
  nghi_teacher_id TEXT REFERENCES teachers(id),   -- GV vắng
  the_teacher_id  TEXT REFERENCES teachers(id),   -- GV được phân công
  ngay            DATE NOT NULL,
  thu             INTEGER NOT NULL,
  tiet            INTEGER NOT NULL,
  lop             TEXT NOT NULL,
  mon             TEXT NOT NULL,
  hoc_ky          INTEGER NOT NULL,
  nam_hoc         TEXT NOT NULL,
  ghi_chu         TEXT
);
```

---

## 5. SCORING ENGINE — Thuật toán xếp hạng ứng viên

File: `src/engine/scoringEngine.js`

### 5.1 Đầu vào
```js
scoreCandidates({
  nghi_teacher_id,   // GV vắng
  ngay,              // Ngày nghỉ (Date)
  thu,               // Thứ trong tuần (2-7)
  tiet,              // Tiết cần thế (1-10)
  mon,               // Môn cần thế
  hoc_ky,
  nam_hoc,
  allTeachers,       // Toàn bộ GV trong tổ
  schedules,         // TKB đợt hiện tại
  substitutions,     // Lịch sử thế từ đầu năm
  locks,             // Danh sách ngoại lệ hiện hành
})
```

### 5.2 Bước 1 — Lọc cứng (Loại ngay nếu vi phạm)
```
❌ Loại: GV đang vắng (chính là người nghỉ)
❌ Loại: GV không dạy môn cần thế (mon_day không chứa môn đó)
❌ Loại: GV đang bị khóa ngoại lệ trong tuần đó (teacher_locks)
❌ Loại: GV đã có tiết dạy chính thức vào đúng (thu, tiet) đó trong TKB
```

### 5.3 Bước 2 — Chấm điểm (điểm CAO = ưu tiên HƠN)

**Tiêu chí A — Thừa giờ tích lũy (trọng số 60%)**
```
thua_gio = số lần GV đã dạy thế trong học kỳ hiện tại
           (đếm từ bảng substitutions)

score_A = 1 / (thua_gio + 1)
// GV chưa thế lần nào: score_A = 1.0
// GV đã thế 3 lần:     score_A = 0.25
// GV đã thế 9 lần:     score_A = 0.1
```

**Tiêu chí B — Tối ưu lịch trong buổi (trọng số 30%)**
```
Kiểm tra TKB của ứng viên vào ngày (thu) cần thế:

Nếu GV có tiết liền kề với tiet cần thế:
  (tiet_gv == tiet-1 hoặc tiet_gv == tiet+1) → score_B = 1.0

Nếu GV có tiết cùng buổi (sáng: 1-5, chiều: 6-10):
  → score_B = 0.66

Nếu GV có tiết cùng ngày nhưng khác buổi:
  → score_B = 0.33

Nếu GV không có tiết nào ngày đó:
  → score_B = 0.1
  // Vẫn có thể phân công nhưng ưu tiên thấp nhất
```

**Tiêu chí C — Số lần thế trong tuần hiện tại (trọng số 10%)**
```
the_tuan = số lần GV đã thế trong tuần chứa ngày nghỉ
score_C = 1 / (the_tuan + 1)
```

**Tổng điểm:**
```js
finalScore = score_A * 0.6 + score_B * 0.3 + score_C * 0.1
```

### 5.4 Đầu ra
```js
// Trả về mảng đã sắp xếp giảm dần theo finalScore
[
  {
    teacher: { id, name },
    finalScore: 0.87,
    thua_gio_hk: 2,          // Đã thế bao nhiêu tiết HK này
    score_A, score_B, score_C,
    lien_ke: true,            // Có tiết liền kề không
    tiet_ngay_do: [2, 3],     // Tiết GV đang dạy ngày đó
    ly_do_uu_tien: "Ít thừa giờ nhất, có tiết liền kề"
  },
  ...
]
// Chỉ trả về top 5, nhưng UI chỉ hiển thị top 3
```

### 5.5 Cảnh báo mất cân bằng
```js
// Sau khi scoring, kiểm tra thêm:
const thua_gio_list = allTeachers.map(gv => countThuaGio(gv.id))
const max = Math.max(...thua_gio_list)
const min = Math.min(...thua_gio_list)
const chenh_lech = max - min

// Nếu chenh_lech > 5: hiện cảnh báo màu vàng
// Nếu chenh_lech > 10: hiện cảnh báo màu đỏ
```

---

## 6. CÁC MÀN HÌNH VÀ UX

### 6.1 Home — Dashboard tổng quan
```
┌─────────────────────────────┐
│  TổThế          [⚙ Cài đặt] │
├─────────────────────────────┤
│  Tuần này: 12/9 - 18/9      │
│  Đợt TKB: Đợt 2 (HK1)      │
├─────────────────────────────┤
│  [+ Phân công dạy thế]      │  ← Nút to nhất, màu nổi bật
├─────────────────────────────┤
│  Cân bằng thừa giờ HK1      │
│  ████░░░ Nguyễn A  : 3 tiết │
│  ██░░░░░ Trần B    : 2 tiết │
│  ████████ Lê C     : 8 tiết │  ← Thanh màu đỏ nếu quá cao
│  [Xem tất cả...]            │
├─────────────────────────────┤
│  Phân công gần đây          │
│  • 12/9 - Toán 10A1 → GV B  │
│  • 11/9 - Lý 11A2  → GV C  │
└─────────────────────────────┘
```

### 6.2 NewSubstitution — Tạo phân công mới (màn chính)
```
Bước 1: Chọn GV vắng + ngày
┌─────────────────────────────┐
│  ← Phân công dạy thế        │
├─────────────────────────────┤
│  Giáo viên vắng             │
│  [Dropdown chọn GV]         │
│                             │
│  Ngày nghỉ                  │
│  [Date picker]              │
│                             │
│  [Tìm giáo viên thay thế →] │
└─────────────────────────────┘

Bước 2: Hiển thị danh sách tiết cần thế (tự động)
┌─────────────────────────────┐
│  GV Nguyễn A vắng 15/9      │
│  Các tiết cần thế:          │
│                             │
│  Tiết 1 — Toán — 10A1       │
│  ┌───────────────────────┐  │
│  │ #1 Trần B      ★★★   │  │  ← 3 sao = khuyến nghị mạnh
│  │ Ít thừa giờ nhất (2) │  │
│  │ Có tiết liền kề (T2) │  │
│  │          [Chọn]      │  │
│  ├───────────────────────┤  │
│  │ #2 Lê C        ★★☆   │  │
│  │ Thừa giờ: 4           │  │
│  │          [Chọn]      │  │
│  ├───────────────────────┤  │
│  │ #3 Phạm D      ★☆☆   │  │
│  │ Không có tiết ngày đó│  │
│  │          [Chọn]      │  │
│  └───────────────────────┘  │
│                             │
│  Tiết 3 — Toán — 11A2       │
│  [tương tự...]              │
└─────────────────────────────┘

Bước 3: Xác nhận
┌─────────────────────────────┐
│  Xác nhận phân công         │
│                             │
│  Tiết 1: Toán 10A1 → GV B  │
│  Tiết 3: Toán 11A2 → GV B  │
│                             │
│  [✓ Lưu phân công]         │
│  [← Điều chỉnh lại]        │
└─────────────────────────────┘
```

### 6.3 Setup — Cấu hình hệ thống (menu phụ)

**Setup > Đợt TKB:**
- Xem danh sách các đợt đã tạo (với ngày hiệu lực)
- Nút "Tạo đợt mới" → nhập tên, từ ngày, đến ngày, học kỳ
- Nút "Đặt làm đợt hiện tại"

**Setup > Thời khóa biểu:**
- Chọn đợt → Import file Excel (hoặc nhập tay từng dòng)
- Hiển thị bảng TKB dạng lưới (thứ × tiết)
- Nút xóa / sửa từng dòng

**Setup > Phân công chuyên môn:**
- Bảng: GV | Môn | Tiết chuẩn/tuần | Học kỳ
- Nhập/sửa inline

**Setup > Ngoại lệ GV:**
- Danh sách khóa đang hiệu lực (badge xanh/đỏ)
- Form thêm: Chọn GV + Từ ngày + Đến ngày + Lý do
- Tự động ẩn khi hết hạn

### 6.4 History — Lịch sử & Báo cáo
```
Filter: [Tất cả HK ▾] [Tất cả GV ▾] [Tháng ▾]

Tổng hợp thừa giờ:
┌──────────────┬──────┬──────┬──────┐
│ Giáo viên    │ HK1  │ HK2  │ Năm  │
├──────────────┼──────┼──────┼──────┤
│ Nguyễn A     │  3   │  -   │  3   │
│ Trần B       │  2   │  -   │  2   │
│ Lê C         │  8   │  -   │  8   │
└──────────────┴──────┴──────┴──────┘

[↓ Xuất Excel]  [↓ Xuất PDF]
```

---

## 7. LUỒNG XỬ LÝ THAY ĐỔI ĐỢT TKB

Khi tổ trưởng tạo đợt TKB mới (ví dụ "Đợt 3"):
1. Tạo bản ghi `schedule_periods` mới với ngày hiệu lực
2. Import TKB mới vào bảng `schedules` gắn với `period_id` mới
3. Cập nhật `assignments` nếu phân công chuyên môn thay đổi
4. **Không xóa** dữ liệu cũ — `substitutions` cũ vẫn gắn với đợt cũ
5. Engine tự dùng đợt có `tu_ngay <= hôm_nay <= den_ngay` để tính

```js
// Hàm lấy đợt TKB hiện tại
function getCurrentPeriod(allPeriods, date = new Date()) {
  return allPeriods.find(p =>
    new Date(p.tu_ngay) <= date && date <= new Date(p.den_ngay)
  )
}
```

---

## 8. DỮ LIỆU MẪU (SEED DATA)

File: `src/data/seed.js`

```js
export const seedTeachers = [
  { id: 'gv_01', name: 'Nguyễn Văn An',    mon_day: ['Toán'],        active: true },
  { id: 'gv_02', name: 'Trần Thị Bình',    mon_day: ['Toán'],        active: true },
  { id: 'gv_03', name: 'Lê Văn Cường',     mon_day: ['Toán', 'Tin'], active: true },
  { id: 'gv_04', name: 'Phạm Thị Dung',    mon_day: ['Toán'],        active: true },
  { id: 'gv_05', name: 'Hoàng Văn Em',     mon_day: ['Tin'],         active: true },
  { id: 'gv_06', name: 'Vũ Thị Phương',    mon_day: ['Tin'],         active: true },
  { id: 'gv_07', name: 'Đặng Văn Giang',   mon_day: ['Tin'],         active: true },
  { id: 'gv_08', name: 'Bùi Thị Hoa',      mon_day: ['Toán', 'Tin'], active: true },
  { id: 'gv_09', name: 'Ngô Văn Inh',      mon_day: ['Toán'],        active: true },
  { id: 'gv_10', name: 'Dương Thị Kim',    mon_day: ['Tin'],         active: true },
  { id: 'gv_11', name: 'Trịnh Văn Long',   mon_day: ['Toán'],        active: true },
  { id: 'gv_12', name: 'Phan Thị Mai',     mon_day: ['Tin'],         active: true },
]

export const seedPeriods = [
  {
    id: 'dot_1',
    nam_hoc: '2025-2026',
    ten_dot: 'Đợt 1 — Khai giảng',
    tu_ngay: '2025-09-02',
    den_ngay: '2025-10-31',
    hoc_ky: 1,
  },
  {
    id: 'dot_2',
    nam_hoc: '2025-2026',
    ten_dot: 'Đợt 2 — Giữa HK1',
    tu_ngay: '2025-11-01',
    den_ngay: '2026-01-15',
    hoc_ky: 1,
  },
]

export const seedSchedules = [
  // GV An — Toán — dạy 4 lớp
  { id: 's001', period_id: 'dot_1', teacher_id: 'gv_01', thu: 2, tiet: 1, lop: '10A1', mon: 'Toán' },
  { id: 's002', period_id: 'dot_1', teacher_id: 'gv_01', thu: 2, tiet: 2, lop: '10A2', mon: 'Toán' },
  { id: 's003', period_id: 'dot_1', teacher_id: 'gv_01', thu: 3, tiet: 3, lop: '11A1', mon: 'Toán' },
  { id: 's004', period_id: 'dot_1', teacher_id: 'gv_01', thu: 4, tiet: 1, lop: '12A1', mon: 'Toán' },
  { id: 's005', period_id: 'dot_1', teacher_id: 'gv_01', thu: 5, tiet: 2, lop: '10A3', mon: 'Toán' },
  // GV Bình — Toán
  { id: 's006', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 3, lop: '10A4', mon: 'Toán' },
  { id: 's007', period_id: 'dot_1', teacher_id: 'gv_02', thu: 3, tiet: 1, lop: '11A2', mon: 'Toán' },
  { id: 's008', period_id: 'dot_1', teacher_id: 'gv_02', thu: 3, tiet: 2, lop: '11A3', mon: 'Toán' },
  { id: 's009', period_id: 'dot_1', teacher_id: 'gv_02', thu: 5, tiet: 1, lop: '12A2', mon: 'Toán' },
  { id: 's010', period_id: 'dot_1', teacher_id: 'gv_02', thu: 6, tiet: 3, lop: '10A5', mon: 'Toán' },
  // GV Cường — Toán + Tin
  { id: 's011', period_id: 'dot_1', teacher_id: 'gv_03', thu: 2, tiet: 4, lop: '10A6', mon: 'Toán' },
  { id: 's012', period_id: 'dot_1', teacher_id: 'gv_03', thu: 4, tiet: 2, lop: '11A4', mon: 'Toán' },
  { id: 's013', period_id: 'dot_1', teacher_id: 'gv_03', thu: 5, tiet: 3, lop: '10B1', mon: 'Tin'  },
  { id: 's014', period_id: 'dot_1', teacher_id: 'gv_03', thu: 6, tiet: 1, lop: '10B2', mon: 'Tin'  },
  // GV Em — Tin
  { id: 's015', period_id: 'dot_1', teacher_id: 'gv_05', thu: 2, tiet: 1, lop: '10B3', mon: 'Tin'  },
  { id: 's016', period_id: 'dot_1', teacher_id: 'gv_05', thu: 2, tiet: 2, lop: '10B4', mon: 'Tin'  },
  { id: 's017', period_id: 'dot_1', teacher_id: 'gv_05', thu: 3, tiet: 4, lop: '11B1', mon: 'Tin'  },
  { id: 's018', period_id: 'dot_1', teacher_id: 'gv_05', thu: 4, tiet: 3, lop: '11B2', mon: 'Tin'  },
  { id: 's019', period_id: 'dot_1', teacher_id: 'gv_05', thu: 5, tiet: 4, lop: '12B1', mon: 'Tin'  },
  // (thêm các GV còn lại tương tự...)
]

export const seedAssignments = [
  { id: 'a01', period_id: 'dot_1', teacher_id: 'gv_01', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a02', period_id: 'dot_1', teacher_id: 'gv_02', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a03', period_id: 'dot_1', teacher_id: 'gv_03', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a04', period_id: 'dot_1', teacher_id: 'gv_04', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a05', period_id: 'dot_1', teacher_id: 'gv_05', mon: 'Tin',  tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a06', period_id: 'dot_1', teacher_id: 'gv_06', mon: 'Tin',  tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a07', period_id: 'dot_1', teacher_id: 'gv_07', mon: 'Tin',  tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a08', period_id: 'dot_1', teacher_id: 'gv_08', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a09', period_id: 'dot_1', teacher_id: 'gv_09', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a10', period_id: 'dot_1', teacher_id: 'gv_10', mon: 'Tin',  tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a11', period_id: 'dot_1', teacher_id: 'gv_11', mon: 'Toán', tiet_chuan: 17, hoc_ky: 1 },
  { id: 'a12', period_id: 'dot_1', teacher_id: 'gv_12', mon: 'Tin',  tiet_chuan: 17, hoc_ky: 1 },
]

// Lịch sử thế mẫu (đã có từ đầu HK1) — để test cân bằng thừa giờ
export const seedSubstitutions = [
  { id: 'sub_01', period_id: 'dot_1', nghi_teacher_id: 'gv_01', the_teacher_id: 'gv_02',
    ngay: '2025-09-05', thu: 5, tiet: 1, lop: '10A1', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_02', period_id: 'dot_1', nghi_teacher_id: 'gv_03', the_teacher_id: 'gv_04',
    ngay: '2025-09-10', thu: 3, tiet: 2, lop: '11A4', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_03', period_id: 'dot_1', nghi_teacher_id: 'gv_05', the_teacher_id: 'gv_06',
    ngay: '2025-09-12', thu: 5, tiet: 3, lop: '10B3', mon: 'Tin',  hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_04', period_id: 'dot_1', nghi_teacher_id: 'gv_02', the_teacher_id: 'gv_02',
    ngay: '2025-09-15', thu: 2, tiet: 1, lop: '12A2', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  // GV Lê C đã thế nhiều lần → để test cảnh báo mất cân bằng
  { id: 'sub_05', period_id: 'dot_1', nghi_teacher_id: 'gv_01', the_teacher_id: 'gv_03',
    ngay: '2025-09-17', thu: 3, tiet: 1, lop: '10A2', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_06', period_id: 'dot_1', nghi_teacher_id: 'gv_04', the_teacher_id: 'gv_03',
    ngay: '2025-09-19', thu: 5, tiet: 2, lop: '11A1', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_07', period_id: 'dot_1', nghi_teacher_id: 'gv_09', the_teacher_id: 'gv_03',
    ngay: '2025-09-22', thu: 2, tiet: 3, lop: '12A1', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_08', period_id: 'dot_1', nghi_teacher_id: 'gv_11', the_teacher_id: 'gv_03',
    ngay: '2025-09-24', thu: 4, tiet: 1, lop: '10A6', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
]

// Ngoại lệ mẫu
export const seedLocks = [
  {
    id: 'lock_01',
    teacher_id: 'gv_04',
    tu_ngay: '2025-09-20',
    den_ngay: '2025-10-10',
    ly_do: 'Bệnh — nghỉ dưỡng',
  },
]
```

---

## 9. CÁC QUY TẮC NGHIỆP VỤ ĐẶC BIỆT

```
1. MỘT NGÀY VẮNG → NHIỀU TIẾT THẾ
   Khi GV vắng cả ngày, hệ thống tự lấy TẤT CẢ tiết của GV đó
   trong ngày từ bảng schedules → tạo danh sách tiết cần thế riêng biệt.
   Mỗi tiết có thể phân công GV khác nhau (không bắt buộc 1 người thế hết).

2. TIẾT CHUẨN 17 TIẾT/TUẦN
   Tiết chuẩn là số tiết dạy chính thức theo phân công chuyên môn.
   Tiết dạy thế KHÔNG tính vào tiết chuẩn mà tính vào THỪA GIỜ.
   Báo cáo cuối kỳ hiển thị: Tiết chuẩn | Tiết thế | Tổng | Thừa/Thiếu.

3. CÂN BẰNG TUYỆT ĐỐI LÀ MỤC TIÊU
   Engine luôn ưu tiên GV có ít thừa giờ nhất (60% trọng số).
   Khi chênh lệch max-min > 5 tiết: hiển thị cảnh báo vàng.
   Khi chênh lệch max-min > 10 tiết: hiển thị cảnh báo đỏ + gợi ý cụ thể.

4. NGOẠI LỆ TỰ ĐỘNG HẾT HIỆU LỰC
   Sau ngày den_ngay, GV tự động trở lại pool bình thường.
   Không cần tổ trưởng thao tác thêm.

5. TKB NHIỀU ĐỢT — KHÔNG MẤT LỊCH SỬ
   Mỗi substitution lưu period_id → kể cả khi TKB đã thay đổi 8 lần,
   báo cáo cuối năm vẫn tổng hợp đúng tất cả lịch sử.

6. KHÔNG CÓ ỨNG VIÊN HỢP LỆ
   Nếu sau lọc cứng không còn GV nào → hiển thị thông báo rõ ràng:
   "Không tìm được GV thay phù hợp cho tiết này. Vui lòng xử lý thủ công."
   Cho phép tổ trưởng ghi chú và lưu trạng thái "Chưa phân công".
```

---

## 10. YÊU CẦU PWA

```js
// vite.config.js — cấu hình PWA
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'TổThế — Phân công dạy thế',
    short_name: 'TổThế',
    theme_color: '#1e40af',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/.*supabase\.co\/.*/,
      handler: 'NetworkFirst',
    }],
  },
})
```

---

## 11. THIẾT KẾ GIAO DIỆN

**Palette màu:**
- Primary: `#1e40af` (xanh dương đậm — chuyên nghiệp, trường học)
- Success: `#16a34a` (xanh lá — GV được đề xuất top 1)
- Warning: `#d97706` (vàng — cảnh báo mất cân bằng nhẹ)
- Danger: `#dc2626` (đỏ — cảnh báo mất cân bằng nặng, ngoại lệ)
- Surface: `#f8fafc` (nền sáng)
- Text: `#0f172a`

**Typography:** Inter (system font stack — không cần load)

**Mobile-first breakpoint:** Max-width 430px, padding 16px, font-size base 16px.

**Component quan trọng nhất — CandidateCard:**
```jsx
// Hiển thị 1 ứng viên trong danh sách gợi ý
<CandidateCard
  rank={1}                    // #1, #2, #3
  name="Trần Thị Bình"
  thua_gio_hk={2}            // Thừa giờ HK này
  lien_ke={true}             // Có tiết liền kề không
  tiet_ngay_do={[1, 2]}      // Tiết GV đang dạy ngày đó
  finalScore={0.87}
  ly_do="Ít thừa giờ nhất, có tiết liền kề"
  onSelect={() => handleSelect(teacher)}
/>
// Rank 1: border xanh đậm + badge "Đề xuất"
// Rank 2: border xanh nhạt
// Rank 3: border xám
```

---

## 12. THỨ TỰ BUILD ĐỀ XUẤT

```
Sprint 1 — Nền tảng (ngày 1-2):
  ✓ Setup Vite + React + Tailwind + PWA plugin
  ✓ Seed data + localStorage service layer
  ✓ Scoring engine + unit tests
  ✓ Zustand store

Sprint 2 — Màn chính (ngày 3-4):
  ✓ Home dashboard
  ✓ NewSubstitution flow (3 bước)
  ✓ CandidateCard component
  ✓ Lưu substitution vào localStorage

Sprint 3 — Setup & Config (ngày 5-6):
  ✓ Setup > Đợt TKB
  ✓ Setup > TKB (nhập tay, import Excel)
  ✓ Setup > Ngoại lệ GV

Sprint 4 — Báo cáo & Polish (ngày 7-8):
  ✓ History + filter
  ✓ Xuất Excel (SheetJS)
  ✓ Xuất PDF (jsPDF)
  ✓ Cảnh báo mất cân bằng
  ✓ Web Share API

Sprint 5 — Production (ngày 9-10):
  ✓ Swap localStorage → Supabase
  ✓ PWA offline test
  ✓ Deploy Vercel / Netlify
```

---

## 13. KIỂM THỬ SCORING ENGINE

Dùng dữ liệu seed để verify các case sau:

```
Case 1: GV An (gv_01) vắng Thứ 2 → Tiết 1 môn Toán lớp 10A1
  Kỳ vọng #1: GV Bình (dạy Toán, có tiết T2-tiết3, thừa giờ ít)
  Kỳ vọng loại: GV Em (dạy Tin, không cùng môn)

Case 2: Tất cả GV Toán đều bận tiết cần thế
  Kỳ vọng: Hiển thị "Không tìm được GV thay"

Case 3: GV Dung bị khóa (lock_01)
  Kỳ vọng: GV Dung không xuất hiện trong danh sách dù phù hợp môn

Case 4: GV Cường (gv_03) đã thế 4 lần (sub_05..08)
  Kỳ vọng: Xuất hiện cuối danh sách dù có tiết liền kề
  Cảnh báo mất cân bằng phải hiện màu vàng
```

---

*Prompt này đã đủ để một AI coding agent build toàn bộ hệ thống PHAN-CONG-DAY-THAY từ đầu đến cuối.*
*Phiên bản: 1.0 — Phòng CNTT - THPT Cà Mau - Năm học 2026-2027*
