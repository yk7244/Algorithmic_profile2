-- 🚨 explore_watch_history RLS 완전 비활성화 (단순 버전)

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can view their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can update their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can delete their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "authenticated_users_all_access" ON explore_watch_history;
DROP POLICY IF EXISTS "authenticated_insert" ON explore_watch_history;
DROP POLICY IF EXISTS "authenticated_select" ON explore_watch_history;
DROP POLICY IF EXISTS "allow_authenticated" ON explore_watch_history;

-- 2. RLS 비활성화
ALTER TABLE explore_watch_history DISABLE ROW LEVEL SECURITY;

-- 3. 확인 (단순 버전)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'explore_watch_history';

-- 결과에서 rowsecurity가 'f' (false)이면 비활성화된 것입니다.
-- 
-- 테스트: 간단한 INSERT 시도
-- INSERT INTO explore_watch_history (user_id, video_id, title, description, timestamp) 
-- VALUES (auth.uid(), 'test123', 'Test Video', 'Test Description', NOW()); 