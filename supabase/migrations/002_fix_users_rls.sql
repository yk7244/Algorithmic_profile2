-- users 테이블 INSERT 정책 추가
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- 기존 정책들을 모든 권한으로 통합 (선택사항)
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

create policy "Users can manage own profile" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id); 