-- explore_watch_history RLS 정책 강화 수정 (v2)
-- 이전 방법이 작동하지 않는 경우 사용하세요

-- 1. RLS 완전히 비활성화하고 다시 설정
ALTER TABLE explore_watch_history DISABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can view their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can update their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Users can delete their own explore watch history" ON explore_watch_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON explore_watch_history;
DROP POLICY IF EXISTS "Enable read access for all users" ON explore_watch_history;
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON explore_watch_history;

-- 3. 테이블 구조 확인 및 수정 (필요한 경우)
-- user_id 컬럼이 UUID 타입인지 확인
DO $$
BEGIN
    -- user_id 컬럼이 text 타입이면 uuid 타입으로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'explore_watch_history' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE explore_watch_history ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    END IF;
END $$;

-- 4. 강화된 RLS 정책 생성
-- 방법 1: 단순한 정책 (가장 권장)
CREATE POLICY "authenticated_users_all_access" ON explore_watch_history
    FOR ALL USING (auth.uid() = user_id);

-- 만약 위의 정책이 작동하지 않으면 아래 정책들을 시도해보세요:

-- 방법 2: 더 구체적인 정책들
-- CREATE POLICY "authenticated_insert" ON explore_watch_history
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "authenticated_select" ON explore_watch_history
--     FOR SELECT USING (auth.uid() = user_id);

-- 방법 3: 모든 인증된 사용자에게 접근 허용 (보안상 권장하지 않음)
-- CREATE POLICY "allow_authenticated" ON explore_watch_history
--     FOR ALL USING (auth.role() = 'authenticated');

-- 5. RLS 활성화
ALTER TABLE explore_watch_history ENABLE ROW LEVEL SECURITY;

-- 6. 테스트 쿼리들
-- 현재 사용자 확인
SELECT auth.uid() as current_user, auth.role() as role;

-- 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'explore_watch_history';

-- 테스트 INSERT (실행 전에 주석 해제하고 실제 값으로 수정)
-- INSERT INTO explore_watch_history (user_id, video_id, title, description, timestamp) 
-- VALUES (auth.uid(), 'test_' || extract(epoch from now()), 'Test Video', 'Test Description', NOW());

-- 테스트 SELECT
-- SELECT * FROM explore_watch_history WHERE user_id = auth.uid() LIMIT 5; 