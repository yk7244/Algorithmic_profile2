-- 🧹 parse_history 테이블 중복 데이터 정리
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. 현재 중복 상태 확인
SELECT 
    user_id,
    COUNT(*) as total_records,
    COUNT(DISTINCT video_id) as unique_videos,
    COUNT(*) - COUNT(DISTINCT video_id) as duplicates
FROM public.parse_history 
GROUP BY user_id
HAVING COUNT(*) > COUNT(DISTINCT video_id)
ORDER BY duplicates DESC;

-- 2. 중복 제거 (각 user_id + video_id 조합당 최신 1개만 보존)
WITH ranked_records AS (
    SELECT 
        id,
        user_id,
        video_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, video_id 
            ORDER BY created_at DESC
        ) as rn
    FROM public.parse_history
)
DELETE FROM public.parse_history 
WHERE id IN (
    SELECT id 
    FROM ranked_records 
    WHERE rn > 1
);

-- 3. 정리 후 상태 확인
SELECT 
    user_id,
    COUNT(*) as total_records,
    COUNT(DISTINCT video_id) as unique_videos,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT video_id) THEN '✅ 정리완료'
        ELSE '❌ 중복존재'
    END as status
FROM public.parse_history 
GROUP BY user_id
ORDER BY user_id;

SELECT '🎉 parse_history 중복 데이터 정리 완료!' as result;