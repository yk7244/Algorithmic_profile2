-- 🧹 모든 테이블의 중복 데이터 정리
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. parse_history 중복 제거
WITH ranked_parse AS (
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
    FROM ranked_parse 
    WHERE rn > 1
);

-- 2. cluster_history 중복 제거 (같은 사용자의 동일한 시간대 중복)
WITH ranked_cluster AS (
    SELECT 
        id,
        user_id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, DATE_TRUNC('minute', created_at)
            ORDER BY created_at DESC
        ) as rn
    FROM public.cluster_history
)
DELETE FROM public.cluster_history 
WHERE id IN (
    SELECT id 
    FROM ranked_cluster 
    WHERE rn > 1
);

-- 3. watch_history 중복 제거
WITH ranked_watch AS (
    SELECT 
        id,
        user_id,
        video_id,
        timestamp,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, video_id, DATE(timestamp)
            ORDER BY created_at DESC
        ) as rn
    FROM public.watch_history
)
DELETE FROM public.watch_history 
WHERE id IN (
    SELECT id 
    FROM ranked_watch 
    WHERE rn > 1
);

-- 4. image_data 중복 제거 (같은 사용자의 동일한 src)
WITH ranked_images AS (
    SELECT 
        id,
        user_id,
        src,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, src
            ORDER BY created_at DESC
        ) as rn
    FROM public.image_data
)
DELETE FROM public.image_data 
WHERE id IN (
    SELECT id 
    FROM ranked_images 
    WHERE rn > 1
);

-- 5. 정리 후 상태 확인
SELECT 
    'parse_history' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(user_id, '|', video_id)) as unique_records
FROM public.parse_history

UNION ALL

SELECT 
    'cluster_history' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM public.cluster_history

UNION ALL

SELECT 
    'watch_history' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(user_id, '|', video_id)) as unique_records
FROM public.watch_history

UNION ALL

SELECT 
    'image_data' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(user_id, '|', src)) as unique_records
FROM public.image_data

ORDER BY table_name;

SELECT '🎉 모든 테이블의 중복 데이터 정리 완료!' as result;