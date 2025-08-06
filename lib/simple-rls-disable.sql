-- 🔧 Simple RLS Disable (권한 문제 해결)
-- Supabase Dashboard → SQL Editor에서 실행

-- 1. reflections 테이블 RLS 비활성화
ALTER TABLE public.reflections DISABLE ROW LEVEL SECURITY;

-- 2. 기본 권한 부여 (supabase_admin 없이)
GRANT ALL ON public.reflections TO anon;
GRANT ALL ON public.reflections TO authenticated;

-- 3. 다른 모든 테이블도 RLS 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parse_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history_arrays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.thumbnail_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;

-- 4. 모든 테이블 권한 부여
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.reflections TO anon, authenticated;
GRANT ALL ON public.watch_history TO anon, authenticated;
GRANT ALL ON public.cluster_history TO anon, authenticated;
GRANT ALL ON public.image_data TO anon, authenticated;
GRANT ALL ON public.slider_history TO anon, authenticated;
GRANT ALL ON public.reflection_answers TO anon, authenticated;
GRANT ALL ON public.parse_history TO anon, authenticated;
GRANT ALL ON public.watch_history_arrays TO anon, authenticated;
GRANT ALL ON public.thumbnail_cache TO anon, authenticated;
GRANT ALL ON public.videos TO anon, authenticated;

-- 5. 시퀀스 권한
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. 확인
SELECT 
    tablename,
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 7. reflections 테이블 직접 테스트
SELECT 'reflections 접근 테스트' as test;
SELECT COUNT(*) FROM public.reflections;

SELECT '✅ 간단한 RLS 비활성화 완료!' as status;