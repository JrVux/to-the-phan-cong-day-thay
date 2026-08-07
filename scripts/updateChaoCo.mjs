import { readFileSync, writeFileSync } from 'node:fs'

const DATA_PATH = 'src/data/schoolData.json'
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'))

const GVCN = [
  { id: 'gv_09', lop: '12D3' },
  { id: 'gv_15', lop: '12D5' },
  { id: 'gv_17', lop: '12B5' },
  { id: 'gv_21', lop: '12C4' },
  { id: 'gv_14', lop: '12D2' },
  { id: 'gv_08', lop: '12C5' },
]
const MON_HDTN = 'HĐ trải nghiệm, hướng nghiệp'

const existingKeys = new Set(
  data.schedules.map((s) => `${s.teacher_id}|${s.thu}|${s.tiet}`),
)
let added = 0
for (const gv of GVCN) {
  const key = `${gv.id}|2|1`
  if (existingKeys.has(key)) {
    console.log(`Bỏ qua ${gv.id}: đã có Thứ 2 tiết 1`)
    continue
  }
  data.schedules.push({
    id: `tkb_chao_co_${gv.id.replace('gv_', '')}`,
    period_id: 'hk2_2025_2026',
    teacher_id: gv.id,
    thu: 2,
    tiet: 1,
    tiet_trong_buoi: 1,
    buoi: 'Sáng',
    lop: gv.lop,
    mon: MON_HDTN,
  })
  existingKeys.add(key)
  added++
}

let updated = 0
for (const gv of GVCN) {
  const exists = data.assignments.some(
    (a) => a.teacher_id === gv.id && a.mon === MON_HDTN,
  )
  if (exists) {
    console.log(`Đã có assignment HĐTN: ${gv.id}`)
    continue
  }
  const teacherAssignment = data.assignments.find((a) => a.teacher_id === gv.id)
  data.assignments.push({
    id: `pc_${gv.id}_hdtn_01`,
    period_id: 'hk2_2025_2026',
    teacher_id: gv.id,
    mon: MON_HDTN,
    classes: [gv.lop],
    tiet_chuan: 17,
    hoc_ky: 2,
    so_lop: 1,
    so_tiet_tuan: 1,
  })
  updated++
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`Đã thêm ${added} dòng TKB chào cờ, ${updated} assignment HĐTN mới`)
console.log('Tổng schedules:', data.schedules.length)
console.log('Tổng assignments:', data.assignments.length)
