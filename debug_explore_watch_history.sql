-- explore_watch_history 테이블 진단 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'explore_watch_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 현재 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'explore_watch_history';

-- 3. RLS 활성화 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'explore_watch_history';

-- 4. 현재 사용자 정보 확인
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'sub' as jwt_sub,
    auth.role() as current_role;

-- 5. 테스트용 INSERT 시도 (실제 데이터는 삽입하지 않음)
-- 다음 쿼리를 수정해서 실제 user_id로 바꿔서 테스트해보세요
-- 현재 로그인한 사용자의 UUID를 넣어야 합니다

-- 예시: INSERT INTO explore_watch_history (user_id, video_id, title, description, timestamp) 
-- VALUES (auth.uid(), 'test123', 'Test Video', 'Test Description', NOW());

-- 6. 기존 데이터 확인 (현재 사용자 데이터만)
SELECT COUNT(*) as my_records_count 
FROM explore_watch_history 
WHERE user_id = auth.uid(); 