export const seedTeachers = [
  { id: 'gv_01', name: 'Nguyễn Văn An', mon_day: ['Toán'], active: true },
  { id: 'gv_02', name: 'Trần Thị Bình', mon_day: ['Toán'], active: true },
  { id: 'gv_03', name: 'Lê Văn Cường', mon_day: ['Toán', 'Tin'], active: true },
  { id: 'gv_04', name: 'Phạm Thị Dung', mon_day: ['Toán'], active: true },
  { id: 'gv_05', name: 'Hoàng Văn Em', mon_day: ['Tin'], active: true },
  { id: 'gv_06', name: 'Vũ Thị Phương', mon_day: ['Tin'], active: true },
  { id: 'gv_07', name: 'Đặng Văn Giang', mon_day: ['Tin'], active: true },
  { id: 'gv_08', name: 'Bùi Thị Hoa', mon_day: ['Toán', 'Tin'], active: true },
  { id: 'gv_09', name: 'Ngô Văn Inh', mon_day: ['Toán'], active: true },
  { id: 'gv_10', name: 'Dương Thị Kim', mon_day: ['Tin'], active: true },
  { id: 'gv_11', name: 'Trịnh Văn Long', mon_day: ['Toán'], active: true },
  { id: 'gv_12', name: 'Phan Thị Mai', mon_day: ['Tin'], active: true },
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
  { id: 's001', period_id: 'dot_1', teacher_id: 'gv_01', thu: 2, tiet: 1, lop: '10A1', mon: 'Toán' },
  { id: 's002', period_id: 'dot_1', teacher_id: 'gv_01', thu: 2, tiet: 2, lop: '10A2', mon: 'Toán' },
  { id: 's003', period_id: 'dot_1', teacher_id: 'gv_01', thu: 3, tiet: 3, lop: '11A1', mon: 'Toán' },
  { id: 's004', period_id: 'dot_1', teacher_id: 'gv_01', thu: 4, tiet: 1, lop: '12A1', mon: 'Toán' },
  { id: 's005', period_id: 'dot_1', teacher_id: 'gv_01', thu: 5, tiet: 2, lop: '10A3', mon: 'Toán' },
  { id: 's006', period_id: 'dot_1', teacher_id: 'gv_02', thu: 2, tiet: 3, lop: '10A4', mon: 'Toán' },
  { id: 's007', period_id: 'dot_1', teacher_id: 'gv_02', thu: 3, tiet: 1, lop: '11A2', mon: 'Toán' },
  { id: 's008', period_id: 'dot_1', teacher_id: 'gv_02', thu: 3, tiet: 2, lop: '11A3', mon: 'Toán' },
  { id: 's009', period_id: 'dot_1', teacher_id: 'gv_02', thu: 5, tiet: 1, lop: '12A2', mon: 'Toán' },
  { id: 's010', period_id: 'dot_1', teacher_id: 'gv_02', thu: 6, tiet: 3, lop: '10A5', mon: 'Toán' },
  { id: 's011', period_id: 'dot_1', teacher_id: 'gv_03', thu: 2, tiet: 4, lop: '10A6', mon: 'Toán' },
  { id: 's012', period_id: 'dot_1', teacher_id: 'gv_03', thu: 4, tiet: 2, lop: '11A4', mon: 'Toán' },
  { id: 's013', period_id: 'dot_1', teacher_id: 'gv_03', thu: 5, tiet: 3, lop: '10B1', mon: 'Tin' },
  { id: 's014', period_id: 'dot_1', teacher_id: 'gv_03', thu: 6, tiet: 1, lop: '10B2', mon: 'Tin' },
  { id: 's015', period_id: 'dot_1', teacher_id: 'gv_05', thu: 2, tiet: 1, lop: '10B3', mon: 'Tin' },
  { id: 's016', period_id: 'dot_1', teacher_id: 'gv_05', thu: 2, tiet: 2, lop: '10B4', mon: 'Tin' },
  { id: 's017', period_id: 'dot_1', teacher_id: 'gv_05', thu: 3, tiet: 4, lop: '11B1', mon: 'Tin' },
  { id: 's018', period_id: 'dot_1', teacher_id: 'gv_05', thu: 4, tiet: 3, lop: '11B2', mon: 'Tin' },
  { id: 's019', period_id: 'dot_1', teacher_id: 'gv_05', thu: 5, tiet: 4, lop: '12B1', mon: 'Tin' },
  { id: 's020', period_id: 'dot_1', teacher_id: 'gv_04', thu: 3, tiet: 4, lop: '10A7', mon: 'Toán' },
  { id: 's021', period_id: 'dot_1', teacher_id: 'gv_06', thu: 2, tiet: 3, lop: '11B3', mon: 'Tin' },
  { id: 's022', period_id: 'dot_1', teacher_id: 'gv_08', thu: 4, tiet: 4, lop: '12A3', mon: 'Toán' },
  { id: 's023', period_id: 'dot_1', teacher_id: 'gv_09', thu: 5, tiet: 3, lop: '12A4', mon: 'Toán' },
  { id: 's024', period_id: 'dot_1', teacher_id: 'gv_10', thu: 6, tiet: 2, lop: '12B2', mon: 'Tin' },
  { id: 's025', period_id: 'dot_1', teacher_id: 'gv_11', thu: 3, tiet: 2, lop: '11A5', mon: 'Toán' },
  { id: 's026', period_id: 'dot_1', teacher_id: 'gv_12', thu: 4, tiet: 1, lop: '11B4', mon: 'Tin' },
  { id: 's027', period_id: 'dot_1', teacher_id: 'gv_08', thu: 2, tiet: 1, lop: '10A8', mon: 'Toán' },
  { id: 's028', period_id: 'dot_1', teacher_id: 'gv_09', thu: 2, tiet: 1, lop: '11A6', mon: 'Toán' },
  { id: 's029', period_id: 'dot_1', teacher_id: 'gv_11', thu: 2, tiet: 1, lop: '12A5', mon: 'Toán' },
]

export const seedAssignments = seedTeachers.map((teacher, index) => ({
  id: `a${String(index + 1).padStart(2, '0')}`,
  period_id: 'dot_1',
  teacher_id: teacher.id,
  mon: teacher.mon_day[0],
  tiet_chuan: 17,
  hoc_ky: 1,
}))

export const seedSubstitutions = [
  { id: 'sub_01', period_id: 'dot_1', nghi_teacher_id: 'gv_01', the_teacher_id: 'gv_02', ngay: '2025-09-05', thu: 5, tiet: 1, lop: '10A1', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_02', period_id: 'dot_1', nghi_teacher_id: 'gv_03', the_teacher_id: 'gv_04', ngay: '2025-09-10', thu: 3, tiet: 2, lop: '11A4', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_03', period_id: 'dot_1', nghi_teacher_id: 'gv_05', the_teacher_id: 'gv_06', ngay: '2025-09-12', thu: 5, tiet: 3, lop: '10B3', mon: 'Tin', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_04', period_id: 'dot_1', nghi_teacher_id: 'gv_02', the_teacher_id: 'gv_02', ngay: '2025-09-15', thu: 2, tiet: 1, lop: '12A2', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_05', period_id: 'dot_1', nghi_teacher_id: 'gv_01', the_teacher_id: 'gv_03', ngay: '2025-09-17', thu: 3, tiet: 1, lop: '10A2', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_06', period_id: 'dot_1', nghi_teacher_id: 'gv_04', the_teacher_id: 'gv_03', ngay: '2025-09-19', thu: 5, tiet: 2, lop: '11A1', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_07', period_id: 'dot_1', nghi_teacher_id: 'gv_09', the_teacher_id: 'gv_03', ngay: '2025-09-22', thu: 2, tiet: 3, lop: '12A1', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
  { id: 'sub_08', period_id: 'dot_1', nghi_teacher_id: 'gv_11', the_teacher_id: 'gv_03', ngay: '2025-09-24', thu: 4, tiet: 1, lop: '10A6', mon: 'Toán', hoc_ky: 1, nam_hoc: '2025-2026' },
]

export const seedLocks = [
  {
    id: 'lock_01',
    teacher_id: 'gv_04',
    tu_ngay: '2025-09-20',
    den_ngay: '2025-10-10',
    ly_do: 'Bệnh — nghỉ dưỡng',
  },
]

export const seedData = {
  teachers: seedTeachers,
  schedule_periods: seedPeriods,
  schedules: seedSchedules,
  assignments: seedAssignments,
  substitutions: seedSubstitutions,
  teacher_locks: seedLocks,
}
