-- explore_watch_history 테이블의 RLS 정책 수정
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.

-- 1. 기존 RLS 정책 확인 (선택사항)
-- SELECT * FROM pg_policies WHERE tablename = 'explore_watch_history';

-- 2. 기존 RLS 정책이 있다면 삭제
DROP POLICY IF EXISTS "Users can insert their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can view their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can update their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can delete their own explore watch history" ON explore_watch_history;

-- 3. 새로운 RLS 정책 생성
-- 사용자는 자신의 explore_watch_history 레코드만 삽입할 수 있음
CREATE POLICY "Users can insert their own explore watch history"
ON explore_watch_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 explore_watch_history 레코드만 조회할 수 있음
CREATE POLICY "Users can view their own explore watch history"
ON explore_watch_history
FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 explore_watch_history 레코드만 업데이트할 수 있음
CREATE POLICY "Users can update their own explore watch history"
ON explore_watch_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 explore_watch_history 레코드만 삭제할 수 있음
CREATE POLICY "Users can delete their own explore watch history"
ON explore_watch_history
FOR DELETE
USING (auth.uid() = user_id);

-- 4. RLS 활성화 확인
ALTER TABLE explore_watch_history ENABLE ROW LEVEL SECURITY;

-- 5. 정책 적용 확인
SELECT * FROM pg_policies WHERE tablename = 'explore_watch_history'; 