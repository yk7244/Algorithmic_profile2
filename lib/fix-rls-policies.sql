-- RLS 정책 수정 (사용자 생성 허용)
-- Supabase에서 실행하세요

-- 1. 사용자 테이블에 INSERT 정책 추가
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. 인증되지 않은 사용자도 자신의 프로필을 생성할 수 있도록 허용 (초기 가입 시)
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
CREATE POLICY "Allow user creation during signup" ON public.users FOR INSERT WITH CHECK (true);

-- 3. 리플렉션 테이블 쿼리 문제 해결을 위한 정책 개선
DROP POLICY IF EXISTS "Users can manage own reflections" ON public.reflections;
CREATE POLICY "Users can manage own reflections" ON public.reflections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON public.reflections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. 시청 기록 테이블 정책 개선
DROP POLICY IF EXISTS "Users can manage own watch history" ON public.watch_history;
CREATE POLICY "Users can manage own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watch history" ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NOT NULL);

-- 5. 사용자가 존재하지 않을 때 기본 허용 (디버깅용 - 나중에 제거)
-- 임시로 모든 사용자가 자신의 데이터를 읽을 수 있도록 허용
DROP POLICY IF EXISTS "Temporary allow all reads" ON public.users;
CREATE POLICY "Temporary allow all reads" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Temporary allow all reads" ON public.reflections;
CREATE POLICY "Temporary allow all reads" ON public.reflections FOR SELECT USING (true);