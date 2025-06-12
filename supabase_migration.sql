-- Supabase에서 실행할 SQL 마이그레이션

-- profile_data 테이블에 bg_color 컬럼 추가
ALTER TABLE profile_data 
ADD COLUMN bg_color TEXT DEFAULT 'bg-gray-50';

-- 기존 레코드들에 기본값 설정
UPDATE profile_data 
SET bg_color = 'bg-gray-50' 
WHERE bg_color IS NULL;

-- 컬럼 추가 확인
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profile_data' AND column_name = 'bg_color';

-- 🆕 WatchHistory 테이블 통합 마이그레이션

-- 1. watch_history 테이블에 source 컬럼 추가
ALTER TABLE watch_history 
ADD COLUMN source TEXT DEFAULT 'upload';

-- 2. 기존 레코드들에 'upload' 값 설정
UPDATE watch_history 
SET source = 'upload' 
WHERE source IS NULL;

-- 3. explore_watch_history 데이터를 watch_history로 이전
INSERT INTO watch_history (user_id, video_id, title, description, source, timestamp)
SELECT 
  user_id, 
  video_id, 
  title, 
  description, 
  'explore' as source,
  timestamp
FROM explore_watch_history
WHERE NOT EXISTS (
  SELECT 1 FROM watch_history 
  WHERE watch_history.user_id = explore_watch_history.user_id 
  AND watch_history.video_id = explore_watch_history.video_id
);

-- 4. explore_watch_history 테이블 삭제 (데이터 이전 후)
-- 주의: 데이터 백업 후 실행하세요!
-- DROP TABLE explore_watch_history;

-- 5. 변경사항 확인
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'watch_history' AND column_name = 'source';

-- 6. 통합된 데이터 확인
SELECT source, COUNT(*) as count 
FROM watch_history 
GROUP BY source; 