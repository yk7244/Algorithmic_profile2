-- 🗑️ TubeLens 데이터베이스 완전 정리 SQL
-- 사용법: Supabase SQL Editor에서 실행

-- 1. 모든 테이블 데이터 삭제 (테이블 구조는 유지)
DELETE FROM cluster_history;
DELETE FROM cluster_images; 
DELETE FROM watch_history;
DELETE FROM slider_history;
DELETE FROM profile_data;

-- 2. 시퀀스 리셋 (ID 카운터 초기화)
ALTER SEQUENCE IF EXISTS cluster_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS cluster_images_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS watch_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS slider_history_id_seq RESTART WITH 1; 
ALTER SEQUENCE IF EXISTS profile_data_id_seq RESTART WITH 1;

-- 3. 정리 완료 확인
SELECT 'cluster_history' as table_name, COUNT(*) as record_count FROM cluster_history
UNION ALL
SELECT 'cluster_images', COUNT(*) FROM cluster_images  
UNION ALL
SELECT 'watch_history', COUNT(*) FROM watch_history
UNION ALL
SELECT 'slider_history', COUNT(*) FROM slider_history
UNION ALL
SELECT 'profile_data', COUNT(*) FROM profile_data;

-- 4. 모든 레코드가 0이면 정리 완료! 🎉 