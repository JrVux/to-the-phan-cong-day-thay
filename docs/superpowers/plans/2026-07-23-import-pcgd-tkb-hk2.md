# Import PCGD and TKB HK II Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace demo teachers, teaching assignments, and schedules with the real HK II 2025–2026 data extracted from `Export_PCGD.xlsx` and `Theo môn - 18.xls`.

**Architecture:** A deterministic Node conversion script reads both source workbooks and writes a versioned JSON dataset consumed by the existing seed layer. The local database key is bumped so installed PWAs receive the new real dataset instead of retaining the old demo snapshot. Morning periods remain 1–5 and afternoon periods map to 6–10.

**Tech Stack:** Node.js, `xlsx`, React, Zustand, Vitest, Vite PWA, Cloudflare Pages.

## Global Constraints

- Import 24 teachers from `Export_PCGD.xlsx`.
- Import 126 Tin học schedule slots from `Theo môn - 18.xls`.
- Map morning periods 1–5 to `tiet` 1–5 and afternoon periods 1–5 to `tiet` 6–10.
- Create period `HK II — Năm học 2025–2026` with `hoc_ky: 2`.
- Keep Tào Phát Đạt and Lê Văn Giang active but with no inferred subject or class.
- Do not modify either source workbook.

---

### Task 1: Deterministic workbook conversion

**Files:**
- Create: `scripts/import-school-data.mjs`
- Create: `src/data/schoolData.json`
- Test: `src/data/schoolData.test.js`

**Interfaces:**
- Consumes: the two source workbook paths supplied to the script.
- Produces: `{ teachers, schedule_periods, schedules, assignments, substitutions, teacher_locks }`.

- [ ] **Step 1: Write the failing dataset integrity test**

```js
import data from './schoolData.json'

it('contains the approved real HK II dataset', () => {
  expect(data.teachers).toHaveLength(24)
  expect(data.schedules).toHaveLength(126)
  expect(data.schedule_periods).toEqual([
    expect.objectContaining({ id: 'hk2_2025_2026', hoc_ky: 2 }),
  ])
  expect(data.schedules.every((row) => row.tiet >= 1 && row.tiet <= 10)).toBe(true)
})
```

- [ ] **Step 2: Run the test and verify it fails because `schoolData.json` does not exist**

Run: `pnpm test:run`

- [ ] **Step 3: Implement the converter**

The converter must normalize Vietnamese names, map the 11 timetable headers to exact full names, parse `Lớp-Môn`, carry forward merged day/session cells, ignore parenthesized non-teaching events, and write stable IDs.

- [ ] **Step 4: Run the converter and dataset test**

Run:

```powershell
node scripts/import-school-data.mjs "C:\Users\jrVux\Downloads\Export_PCGD.xlsx" "E:\DAPC DAY THAY\Theo môn - 18.xls"
pnpm test:run
```

Expected: 24 teachers, 126 schedules, no duplicate teacher/day/period keys.

### Task 2: Replace demo seed and migrate installed PWAs

**Files:**
- Modify: `src/data/seed.js`
- Modify: `src/services/localStorageDb.js`
- Test: `src/services/database.test.js`

**Interfaces:**
- Consumes: default export from `src/data/schoolData.json`.
- Produces: `seedData` backed only by the real HK II dataset and storage key `to_the_database_v2`.

- [ ] **Step 1: Add a failing database test**

```js
expect(db.getAll('teachers')).toHaveLength(24)
expect(db.getAll('schedules')).toHaveLength(126)
expect(db.getAll('schedule_periods')[0].hoc_ky).toBe(2)
```

- [ ] **Step 2: Verify the test fails against the demo seed**

Run: `pnpm test:run`

- [ ] **Step 3: Replace the seed export and bump the storage key**

`seed.js` re-exports the six arrays from `schoolData.json`; `localStorageDb.js` changes the storage key from `tothe_database_v1` to `to_the_database_v2`.

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test:run`

Expected: all tests pass with the real dataset.

### Task 3: Make real subjects and assignments visible

**Files:**
- Modify: `src/pages/Setup/SetupTeachers.jsx`
- Modify: `src/pages/Setup/SetupSchedule.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes: teacher `mon_day`, assignment `classes`, and schedule `buoi`.
- Produces: visible subject badges, assigned class list, and `Sáng/Chiều` labels.

- [ ] **Step 1: Add failing UI assertions**

Assert that the setup pages render `Tin học`, `Giáo dục thể chất`, `GDQP AN`, assigned class information, and at least one afternoon label.

- [ ] **Step 2: Verify the assertions fail**

Run: `pnpm test:run`

- [ ] **Step 3: Render the imported fields**

Show `Chưa xác định` for the two teachers whose source assignment is only `15`; do not infer a subject.

- [ ] **Step 4: Run tests and build**

Run:

```powershell
pnpm test:run
pnpm build
```

Expected: tests and production build pass.

### Task 4: Publish and verify

**Files:**
- No source changes.

- [ ] **Step 1: Commit the validated import**

```powershell
git add scripts src
git commit -m "feat: import real HK II teaching data"
```

- [ ] **Step 2: Deploy to Cloudflare Pages**

```powershell
pnpm dlx wrangler@latest pages deploy dist --project-name to-the-phan-cong-day-thay --branch main
```

- [ ] **Step 3: Verify production**

Confirm the production PWA shows 24 active teachers, 126 timetable rows, the HK II period, and the new logo/brand without console or loading errors.
