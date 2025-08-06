-- RLS 완전 비활성화 (개발용)
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. 모든 기존 정책 삭제
DO $$
BEGIN
    -- users 테이블 정책 삭제
    DROP POLICY IF EXISTS "Users can read own data" ON public.users;
    DROP POLICY IF EXISTS "Users can update own data" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
    DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
    DROP POLICY IF EXISTS "Temporary allow all reads" ON public.users;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.users;
    
    -- profiles 테이블 정책 삭제
    DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.profiles;
    
    -- reflections 테이블 정책 삭제
    DROP POLICY IF EXISTS "Users can manage own reflections" ON public.reflections;
    DROP POLICY IF EXISTS "Users can insert own reflections" ON public.reflections;
    DROP POLICY IF EXISTS "Temporary allow all reads" ON public.reflections;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.reflections;
    
    -- 다른 테이블들의 정책도 삭제
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.watch_history;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.cluster_history;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.image_data;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.slider_history;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.reflection_answers;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.parse_history;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.watch_history_arrays;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.thumbnail_cache;
END $$;

-- 2. RLS 완전 비활성화 (개발 단계에서만 사용)
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

-- 3. 확인용 쿼리
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 성공 메시지
SELECT 'RLS가 완전히 비활성화되었습니다! (개발용)' as status;