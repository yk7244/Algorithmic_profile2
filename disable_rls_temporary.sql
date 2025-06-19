-- 🚨 임시 해결책: explore_watch_history RLS 완전 비활성화
-- 보안상 권장하지 않지만, 급한 상황에서 임시적으로 사용할 수 있습니다.
-- 나중에 반드시 RLS를 다시 활성화해야 합니다!

-- 1. 모든 정책 삭제
DROP POLICY IF EXISTS "Users can insert their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can view their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can update their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can delete their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "authenticated_users_all_access" ON explore_watch_history;
DROP POLICY IF EXISTS "authenticated_insert" ON explore_watch_history;
DROP POLICY IF EXISTS "authenticated_select" ON explore_watch_history;
DROP POLICY IF EXISTS "allow_authenticated" ON explore_watch_history;

-- 2. RLS 완전 비활성화
ALTER TABLE explore_watch_history DISABLE ROW LEVEL SECURITY;

-- 3. 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'explore_watch_history';

-- 이제 모든 사용자가 explore_watch_history 테이블에 접근할 수 있습니다.
-- 🚨 보안 위험: 모든 사용자가 다른 사용자의 시청기록을 볼 수 있습니다!
-- 
-- 나중에 다시 RLS를 활성화하려면:
-- ALTER TABLE explore_watch_history ENABLE ROW LEVEL SECURITY;
-- 그리고 적절한 정책을 다시 생성하세요. 