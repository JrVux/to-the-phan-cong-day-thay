-- Tổ Thế database schema (có đăng nhập & mã mời)
-- Chạy toàn bộ file này trong Supabase SQL Editor.
-- Sau đó: Authentication → Providers → Email → đảm bảo "Confirm email" bật hoặc tắt tuỳ ý.
-- Người đầu tiên tự đăng ký sẽ tự thành ADMIN (không cần mã mời).
-- Những người đăng ký sau PHẢI có mã mời hợp lệ (admin tạo).

-- ============================================================
-- NGHIỆP VỤ
-- ============================================================
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

-- ============================================================
-- NGƯỜI DÙNG & MÃ MỜI
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  max_uses integer not null default 1 check (max_uses > 0),
  used_uses integer not null default 0 check (used_uses >= 0),
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Tạo profile + kiểm tra mã mời khi tạo tài khoản.
-- Người ĐẦU TIÊN (chưa có admin) -> role admin, KHÔNG cần mã mời.
-- Các tài khoản sau -> role user, BẮT BUỘC có mã mời hợp lệ (trong user_metadata.invite_code).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite text := coalesce(new.raw_user_meta_data ->> 'invite_code', '');
  v_has_admin boolean;
begin
  select exists(select 1 from public.profiles) into v_has_admin;

  if not v_has_admin then
    -- Người đầu tiên -> admin
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'admin');
  else
    -- Người tiếp theo -> cần mã mời
    if v_invite = '' then
      raise exception 'Vui lòng nhập mã mời.';
    end if;
    update public.invite_codes
       set used_uses = used_uses + 1
     where code = v_invite
       and active = true
       and used_uses < max_uses;
    if not found then
      raise exception 'Mã mời không hợp lệ hoặc đã hết lượt.';
    end if;
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'user');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Xoá tài khoản -> xoá profile
create or replace function public.delete_user_cascade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.delete_user_cascade();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.teachers enable row level security;
alter table public.schedule_periods enable row level security;
alter table public.schedules enable row level security;
alter table public.assignments enable row level security;
alter table public.teacher_locks enable row level security;
alter table public.substitutions enable row level security;
alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;

do $$
declare table_name text;
begin
  -- Dữ liệu nghiệp vụ: chỉ người ĐÃ ĐĂNG NHẬP thao tác được
  foreach table_name in array array[
    'teachers', 'schedule_periods', 'schedules', 'assignments', 'teacher_locks', 'substitutions'
  ] loop
    execute format('drop policy if exists "internal_demo_access" on public.%I', table_name);
    execute format(
      'create policy "authenticated_access" on public.%I for all to authenticated using (true) with check (true)',
      table_name
    );
  end loop;
end $$;

-- Hàm kiểm tra admin bằng security definer (tránh đệ quy RLS khi tham chiếu chính bảng profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- profiles: người dùng xem/sửa profile của bản thân; admin xem sửa tất cả
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin());

-- invite_codes: chỉ admin thấy/quản lý được
drop policy if exists "invite_admin_all" on public.invite_codes;
create policy "invite_admin_all" on public.invite_codes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());