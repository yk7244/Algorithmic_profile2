-- 🚨 RLS 완전 비활성화 (간단 버전)
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 모든 테이블의 RLS 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parse_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history_arrays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.thumbnail_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;

-- 확인 쿼리
SELECT 
    tablename, 
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'profiles', 'reflections', 'watch_history', 'cluster_history', 'image_data')
ORDER BY tablename;

-- 성공 메시지
SELECT '✅ RLS가 모든 테이블에서 비활성화되었습니다!' as status;