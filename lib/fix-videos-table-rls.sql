-- 🔥 videos 테이블 RLS 비활성화
-- Supabase Dashboard → SQL Editor에서 실행

-- videos 테이블 RLS 비활성화
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;

-- videos 테이블 권한 부여
GRANT ALL ON public.videos TO anon;
GRANT ALL ON public.videos TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 확인
SELECT 
    tablename,
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename = 'videos';

SELECT '✅ videos 테이블 RLS 비활성화 완료!' as status;