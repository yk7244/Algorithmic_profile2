-- 기존 트리거와 함수 삭제
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 개선된 사용자 생성 함수
create or replace function public.handle_new_user()
returns trigger 
language plpgsql
security definer set search_path = public
as $$
begin
  -- users 테이블에 새 사용자 레코드 생성 (UPSERT 사용)
  insert into public.users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
    
  return new;
end;
$$;

-- 새로운 트리거 생성
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- users 테이블에 대한 RLS 정책을 더 관대하게 설정
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can manage own profile" on public.users;

-- 모든 인증된 사용자가 자신의 레코드를 관리할 수 있도록 설정
create policy "Authenticated users can manage own profile" on public.users
  for all 
  using (auth.uid() = id) 
  with check (auth.uid() = id);

-- 추가로, 인증된 사용자는 자신의 레코드를 삽입할 수 있도록 허용
create policy "Authenticated users can insert own profile" on public.users
  for insert 
  to authenticated
  with check (auth.uid() = id); 