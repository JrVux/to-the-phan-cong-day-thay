-- TổThế database schema
-- Chạy toàn bộ file này trong Supabase SQL Editor.

create table if not exists public.teachers (
  id text primary key,
  name text not null,
  mon_day text[] not null default '{}',
  active boolean not null default true
);

create table if not exists public.schedule_periods (
  id text primary key,
  nam_hoc text not null,
  ten_dot text not null,
  tu_ngay date not null,
  den_ngay date not null,
  hoc_ky integer not null check (hoc_ky in (1, 2)),
  constraint schedule_period_valid_dates check (tu_ngay <= den_ngay)
);

create table if not exists public.schedules (
  id text primary key,
  period_id text not null references public.schedule_periods(id) on delete cascade,
  teacher_id text not null references public.teachers(id),
  thu integer not null check (thu between 2 and 7),
  tiet integer not null check (tiet between 1 and 10),
  buoi text not null default 'Sáng',
  tiet_trong_buoi integer not null default 0,
  lop text not null,
  mon text not null,
  unique (period_id, teacher_id, thu, tiet)
);

create table if not exists public.assignments (
  id text primary key,
  period_id text not null references public.schedule_periods(id) on delete cascade,
  teacher_id text not null references public.teachers(id),
  mon text not null,
  tiet_chuan integer not null check (tiet_chuan >= 0),
  hoc_ky integer not null check (hoc_ky in (1, 2)),
  classes text[] not null default '{}',
  so_lop integer not null default 0,
  so_tiet_tuan integer not null default 0,
  phu_cap_cn integer not null default 0
);

create table if not exists public.teacher_locks (
  id text primary key,
  teacher_id text not null references public.teachers(id),
  tu_ngay date not null,
  den_ngay date not null,
  ly_do text not null,
  constraint teacher_lock_valid_dates check (tu_ngay <= den_ngay)
);

create table if not exists public.substitutions (
  id text primary key,
  created_at timestamptz not null default now(),
  period_id text not null references public.schedule_periods(id),
  nghi_teacher_id text not null references public.teachers(id),
  the_teacher_id text references public.teachers(id),
  ngay date not null,
  thu integer not null check (thu between 2 and 7),
  tiet integer not null check (tiet between 1 and 10),
  tiet_trong_buoi integer not null default 0,
  buoi text not null default 'Sáng',
  lop text not null,
  mon text not null,
  hoc_ky integer not null check (hoc_ky in (1, 2)),
  nam_hoc text not null,
  ghi_chu text default '',
  status text not null default 'assigned' check (status in ('assigned', 'unassigned'))
);

create index if not exists schedules_period_teacher_idx on public.schedules(period_id, teacher_id);
create index if not exists substitutions_school_term_idx on public.substitutions(nam_hoc, hoc_ky);
create index if not exists substitutions_substitute_idx on public.substitutions(the_teacher_id, ngay);
create index if not exists teacher_locks_date_idx on public.teacher_locks(teacher_id, tu_ngay, den_ngay);

-- Ứng dụng dành cho một tổ trưởng và không yêu cầu đăng nhập.
-- Các policy anon dưới đây phù hợp bản triển khai nội bộ/demo. Với dữ liệu thật,
-- nên bật Supabase Auth và thay policy bằng điều kiện auth.uid().
alter table public.teachers enable row level security;
alter table public.schedule_periods enable row level security;
alter table public.schedules enable row level security;
alter table public.assignments enable row level security;
alter table public.teacher_locks enable row level security;
alter table public.substitutions enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'teachers', 'schedule_periods', 'schedules', 'assignments', 'teacher_locks', 'substitutions'
  ] loop
    execute format('drop policy if exists "internal_demo_access" on public.%I', table_name);
    execute format(
      'create policy "internal_demo_access" on public.%I for all to anon using (true) with check (true)',
      table_name
    );
  end loop;
end $$;
