import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const regular = readFileSync(join(root, 'public/fonts/DejaVuSans.ttf')).toString('base64')
const bold = readFileSync(join(root, 'public/fonts/DejaVuSans-Bold.ttf')).toString('base64')

const doc = new jsPDF({ unit: 'mm', format: 'a4' })
doc.addFileToVFS('DejaVuSans.ttf', regular)
doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
doc.addFileToVFS('DejaVuSans-Bold.ttf', bold)
doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold')

const pageWidth = doc.internal.pageSize.getWidth()
const pageHeight = doc.internal.pageSize.getHeight()
const margin = 18
const contentWidth = pageWidth - margin * 2

let cursorY = 20

function ensureSpace(needed) {
  if (cursorY + needed > pageHeight - 16) {
    doc.addPage()
    cursorY = 20
  }
}

function title(text) {
  ensureSpace(24)
  doc.setFont('DejaVuSans', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20, 24, 39)
  doc.text(text, margin, cursorY)
  cursorY += 9
  doc.setDrawColor(79, 107, 240)
  doc.setLineWidth(1)
  doc.line(margin, cursorY, margin + 30, cursorY)
  cursorY += 7
}

function section(text) {
  ensureSpace(20)
  doc.setFont('DejaVuSans', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 41, 59)
  doc.text(text, margin, cursorY)
  cursorY += 7
}

function subtitle(text) {
  ensureSpace(14)
  doc.setFont('DejaVuSans', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 64, 175)
  doc.text(text, margin, cursorY)
  cursorY += 6
}

function paragraph(text, { bold = false } = {}) {
  doc.setFont('DejaVuSans', bold ? 'bold' : 'normal')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  const lines = doc.splitTextToSize(text, contentWidth)
  for (const line of lines) {
    ensureSpace(6)
    doc.text(line, margin, cursorY)
    cursorY += 5
  }
  cursorY += 2
}

function bullet(items) {
  for (const item of items) {
    doc.setFont('DejaVuSans', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    const lines = doc.splitTextToSize(item, contentWidth - 6)
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(6)
      if (i === 0) doc.text('•', margin, cursorY)
      doc.text(lines[i], margin + 4, cursorY)
      cursorY += 5
    }
    cursorY += 1
  }
}

function table(head, body) {
  ensureSpace(30)
  autoTable(doc, {
    startY: cursorY,
    head: [head],
    body,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { font: 'DejaVuSans', fontSize: 8.5, textColor: [55, 65, 81], cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })
  cursorY = doc.lastAutoTable.finalY + 6
}

function footer() {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('DejaVuSans', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Tổ Tin - Thể dục - GDQP | Hướng dẫn sử dụng', margin, pageHeight - 8)
    doc.text(`${i} / ${total}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }
}

title('HƯỚNG DẪN SỬ DỤNG')
doc.setFont('DejaVuSans', 'normal')
doc.setFontSize(11)
doc.setTextColor(71, 85, 105)
const intro = doc.splitTextToSize(
  'Hệ thống Phân công dạy thay của Tổ Tin - Thể dục - GDQP dành cho tổ trưởng chuyên môn. Phần mềm chạy trên điện thoại và máy tính, cài được thành ứng dụng (PWA), dùng được cả khi mất mạng.',
  contentWidth,
)
for (const line of intro) {
  ensureSpace(6)
  doc.text(line, margin, cursorY)
  cursorY += 5
}
cursorY += 4

section('1. Bắt đầu')
subtitle('1.1 Mở và cài ứng dụng trên điện thoại')
bullet([
  'Mở trình duyệt Chrome (Android) hoặc Safari (iPhone) đến địa chỉ: https://jrvux.github.io/to-the-phan-cong-day-thay/',
  'Chọn "Cài đặt ứng dụng" (Chrome) hoặc "Chia sẻ → Thêm vào màn hình chính" (Safari).',
  'Mở app từ màn hình chính như một ứng dụng bình thường. Dùng offline vẫn được.',
])
subtitle('1.2 Cấu trúc màn hình')
table(
  ['Mục', 'Chức năng'],
  [
    ['Tổng quan', 'Số liệu GV, tiết thế trong tháng, chưa phân công, ngoại lệ + phân công gần đây'],
    ['Phân công', 'Tác vụ chính: tạo phân công dạy thay'],
    ['Lịch sử', 'Lịch sử phân công, báo cáo cân bằng tiết chuẩn, xuất Excel/PDF'],
    ['Thiết lập', 'Giáo viên, đợt TKB, thời khóa biểu, ngoại lệ, năm mới'],
  ],
)

section('2. Phân công dạy thay (tác vụ chính)')
paragraph('Chỉ cần 2 thao tác, phần còn lại hệ thống tự làm:', { bold: true })
subtitle('Bước 1 — Chọn giáo viên vắng và ngày nghỉ')
bullet([
  'Chọn "Giáo viên vắng" trong danh sách.',
  'Chọn "Ngày nghỉ".',
  'Nhấn "Tìm tiết cần thế".',
])
subtitle('Bước 2 — Chọn người thế')
bullet([
  'Hệ thống liệt kê tất cả tiết cần bố trí của GV vắng trong ngày đó.',
  'Tiết chào cờ thứ 2 (Sáng T1 và Chiều T5) được tự động bỏ qua — không tìm GV thế.',
  'Mỗi tiết hiển thị top 3 ứng viên kèm lý do: thiếu/thừa tiết chuẩn, tiết liền kề, đã thế bao nhiêu tiết hôm nay; TKB hôm nay của ứng viên; phía trên mỗi tiết còn hiện TKB gọn của GV nghỉ để đối chiếu.',
  'Nhấn "Chọn giáo viên" trên thẻ ứng viên muốn dùng.',
  'Có thể nhấn "Tự chọn phân công tối ưu nhất" để hệ thống gán 1 lớp 1 GV thế, dạy liên tiếp, ưu tiên GV thiếu tiết chuẩn nhất.',
  'Nếu không có ứng viên hợp lệ, phần mềm báo để xử lý thủ công (ghi chú, vẫn có thể lưu "chưa phân công").',
])
subtitle('Bước 3 — Xác nhận và lưu')
bullet([
  'Xem lại toàn bộ phân công → "Lưu phân công".',
  'Sau khi lưu có thể "Xuất báo cáo PDF" (phiếu phân công gửi tổ), "Chia sẻ kết quả" (Zalo/SMS) hoặc "Tạo phân công khác".',
])
paragraph(
  'Quy định hệ thống tự kiểm tra: mỗi GV thế tối đa 3 tiết/ngày, 3 tiết/tuần, 4 tiết/buổi và tổng dạy + thế không quá 6 tiết/ngày. Nếu ứng viên vượt giới hạn, hệ thống vẫn cho chọn nhưng thẻ có cảnh báo đỏ "Vi phạm giới hạn" kèm chi tiết lý do; khi lưu phần mềm nhắc lại tên người vi phạm để tổ trưởng chủ động quyết định.',
)

section('3. Lịch sử & Báo cáo')
bullet([
  'Bộ lọc: chọn học kỳ, giáo viên, tháng để xem đúng phần cần.',
  'Tổng hợp cân bằng tiết chuẩn: bảng từng GV với Tiết chuẩn, Tiết/tuần (đã cộng phụ cấp chủ nhiệm +4), Số tiết thế, Số tuần đã qua và Thừa/Thiếu. Cảnh báo vàng/đỏ khi chênh lệch lớn.',
  'Cách đọc cột Thừa/Thiếu: đây là tổng cộng dồn cho cả đợt/học kỳ, không phải của 1 tuần. Ví dụ GV chuẩn 15 mà dạy 9 tiết/tuần thì mỗi tuần thiếu 6; sau 3,5 tuần cộng dồn ra Thiếu 21. Cột "Số tuần qua" giúp đối chiếu con số này.',
  'Xuất báo cáo: Xuất Excel (số liệu thô, gồm cả cột Số tuần qua), Xuất PDF (hồ sơ tổ), và Xuất PDF theo từng GV vắng — mỗi GV nghỉ trong kỳ được tạo 1 file PDF riêng, toàn bộ tiết cần bố trí gom vào một bảng trên 1 trang, xếp theo thứ trong tuần tăng dần (Thứ 2 → Chủ nhật) kèm ngày, GV dạy thế và khối chữ ký.',
  'Chi tiết lịch sử: hiển thị một bảng gọn gồm Ngày, Tiết dạy, Lớp/Môn, GV vắng, GV dạy thế, trạng thái, học kỳ — xếp tăng dần theo ngày và thứ để dễ dò lại. Nút xóa (xác nhận) khi phân nhầm.',
])

section('4. Thiết lập hệ thống')
subtitle('4.1 Giáo viên')
bullet([
  'Thêm GV: nhấn "+ Thêm GV", nhập họ tên, chọn môn dạy (Tin học, Giáo dục thể chất, GDQP AN, HĐTN-HN), đánh dấu đang hoạt động.',
  'Sửa / Tạm ẩn: nhấn bút chì trên thẻ GV.',
  'Phân công chuyên môn: bảng dưới cùng để chỉnh theo từng đợt — môn chính thức, tiết chuẩn (mặc định 17), kiêm nhiệm (tối đa 2): Chủ nhiệm (+4), Tổ trưởng (−3), Tổ phó (−1), TTND (−2), TTCĐ (−3), TPCĐ (−1), KTPM Tin (−2), Phó BTĐ (chuẩn 8,5), Bí thư Đoàn (chuẩn 2,5). Danh sách Lớp phân cách bằng dấu phẩy, nhấn Enter để lưu.',
])
subtitle('4.2 Đợt TKB')
bullet([
  'Tạo đợt mới (tên, năm học, từ ngày → đến ngày, học kỳ) khi đổi TKB.',
  '"Đặt làm đợt hiện tại" để dùng mặc định.',
  'Dữ liệu đợt cũ luôn được giữ nguyên, không mất lịch sử.',
])
subtitle('4.3 Thời khóa biểu')
bullet([
  'Chọn đợt TKB.',
  'Import Excel: nhấn "Import Excel", chọn file .xlsx/.xls/.csv. Cột phải có: Giáo viên (hoặc Mã GV), Thứ (2–7), Tiết (1–10), Lớp, Môn. Xem trước → Xác nhận import.',
  'Nhập một dòng: thêm thủ công từng dòng.',
  'Lưới TKB: bảng thứ × buổi × tiết của toàn tổ (kèm lớp), cột cuối là tổng tiết.',
  'Cập nhật phân công từ TKB: tự đồng bộ số tiết/tuần và lớp vào bảng phân công chuyên môn.',
  'Lưu ý: tạo đợt TKB mới trước khi import TKB mới, để không đè dữ liệu cũ.',
])
subtitle('4.4 Ngoại lệ giáo viên')
bullet([
  'Dùng cho GV nghỉ dài ngày, kiêm nhiệm BGH… — những người này không được gợi ý dạy thế.',
  'Thêm: chọn GV, từ ngày → đến ngày, ghi lý do. Tự hết hiệu lực khi quá ngày kết thúc.',
])
subtitle('4.5 Năm mới')
bullet([
  'Bắt đầu năm học mới: xóa lịch sử dạy thay, thời khóa biểu, phân công chuyên môn và ngoại lệ của năm cũ; giữ nguyên danh sách giáo viên. Gõ XÁC NHẬN rồi bấm xác nhận. Sau đó tạo đợt TKB mới trong 4.2 và import TKB mới.',
  'Xóa toàn bộ dữ liệu: khôi phục về dữ liệu mẫu ban đầu (dùng khi chạy thử hoặc làm lại từ đầu).',
  'Gợi ý trình tự: (1) Thiết lập → Năm mới → Bắt đầu năm học mới → (2) tạo Đợt TKB mới cho năm học → (3) Thời khóa biểu → Import Excel TKB mới.',
])

section('5. Mẹo dùng trên điện thoại')
bullet([
  'Bảng rộng (TKB, phân công chuyên môn, báo cáo) cuộn ngang được; cột "Giáo viên" và dòng tiêu đề luôn cố định khi cuộn.',
  'Cài làm ứng dụng để có màn hình riêng, không bị thanh trình duyệt che.',
  'Mất mạng vẫn thao tác được; dữ liệu được lưu ngay trên máy.',
])

section('6. Khắc phục nhanh')
table(
  ['Tình huống', 'Cách xử lý'],
  [
    ['Báo "Không có đợt TKB hiệu lực"', 'Kiểm tra Thiết lập → Đợt TKB, đảm bảo ngày chọn nằm trong khoảng từ/đến của một đợt và đã có TKB trong đợt.'],
    ['Báo "Giáo viên không có tiết dạy trong ngày này"', 'GV vắng ngày đó không có tiết theo TKB (hoặc chỉ có tiết chào cờ). Chọn ngày khác.'],
    ['Ứng viên có cảnh báo "Vi phạm giới hạn"', 'GV đó đã chạm tối đa 3 thế/ngày, 3/tuần, 4/buổi hoặc 6 tiết/ngày. Vẫn chọn được nếu tổ trưởng chấp nhận; thẻ sẽ ghi rõ lý do và khi lưu hệ thống nhắc lại.'],
    ['Không tìm được GV thay', 'Toàn bộ GV cùng môn vắng/bị khóa hoặc trùng tiết đúng (thứ, tiết) đó. Xử lý thủ công + ghi chú.'],
    ['Chưa phân công được vẫn lưu', 'Được phép: ghi chú lý do và lưu trạng thái "Chưa phân công" để theo dõi sau.'],
    ['Phân nhầm người', 'Vào Lịch sử, nhấn nút xóa trên bản ghi (có xác nhận), tạo lại phân công.'],
    ['Thấy "Thừa/Thiếu" lớn hơn chênh lệch 1 tuần', 'Đây là tổng cộng dồn qua các đợt (nhân với số tuần). Xem cột "Số tuần qua" để đối chiếu.'],
    ['Đổi sang năm học mới', 'Thiết lập → Năm mới → Bắt đầu năm học mới, rồi tạo Đợt TKB mới và import TKB.'],
  ],
)

footer()

const outPath = join(root, 'docs', 'HUONG-DAN-SU-DUNG.pdf')
const webPath = join(root, 'public', 'HUONG-DAN-SU-DUNG.pdf')
const out = Buffer.from(doc.output('arraybuffer'))
writeFileSync(outPath, out)
writeFileSync(webPath, out)
console.log('PDF created:', outPath)
console.log('PDF copied for web:', webPath)
