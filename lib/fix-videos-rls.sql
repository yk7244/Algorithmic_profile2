-- 🔥 videos 테이블 RLS 비활성화 (긴급)
-- Supabase Dashboard의 SQL Editor에서 즉시 실행하세요

-- videos 테이블 RLS 비활성화
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
    tablename, 
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'videos';

SELECT '✅ videos 테이블 RLS 비활성화 완료!' as result;