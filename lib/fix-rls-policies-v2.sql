-- RLS 정책 완전 재설정 (v2)
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Temporary allow all reads" ON public.users;

DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;

DROP POLICY IF EXISTS "Users can manage own reflections" ON public.reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON public.reflections;
DROP POLICY IF EXISTS "Temporary allow all reads" ON public.reflections;

DROP POLICY IF EXISTS "Users can manage own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON public.watch_history;

DROP POLICY IF EXISTS "Users can manage own cluster history" ON public.cluster_history;
DROP POLICY IF EXISTS "Users can manage own images" ON public.image_data;
DROP POLICY IF EXISTS "Public images are readable" ON public.image_data;

-- 2. 사용자 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.users FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. 프로필 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.profiles FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. 리플렉션 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.reflections FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. 시청 기록 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.watch_history FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. 클러스터 히스토리 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.cluster_history FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. 이미지 데이터 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.image_data FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. 슬라이더 히스토리 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.slider_history FOR ALL USING (auth.uid() IS NOT NULL);

-- 9. 리플렉션 답변 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.reflection_answers FOR ALL USING (auth.uid() IS NOT NULL);

-- 10. 파싱 히스토리 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.parse_history FOR ALL USING (auth.uid() IS NOT NULL);

-- 11. 시청 기록 배열 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.watch_history_arrays FOR ALL USING (auth.uid() IS NOT NULL);

-- 12. 썸네일 캐시 테이블 정책 (완전 허용)
CREATE POLICY "Allow all operations for authenticated users" ON public.thumbnail_cache FOR ALL USING (auth.uid() IS NOT NULL);

-- 알림: 정책 적용 완료
SELECT 'RLS 정책이 성공적으로 적용되었습니다!' as status;