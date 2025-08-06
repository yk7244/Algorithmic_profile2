-- 🔧 reflections 테이블 스키마 완전 수정
-- Supabase Dashboard → SQL Editor에서 실행

-- 1. 누락된 컬럼들 추가
ALTER TABLE public.reflections 
ADD COLUMN IF NOT EXISTS reflection1_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reflection2_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reflection1_answers JSONB,
ADD COLUMN IF NOT EXISTS reflection2_answers JSONB,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 기존 데이터 마이그레이션 (reflection1 → reflection1_completed)
UPDATE public.reflections 
SET reflection1_completed = reflection1,
    reflection2_completed = reflection2
WHERE reflection1_completed IS NULL OR reflection2_completed IS NULL;

-- 3. 확인 쿼리
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reflections' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. 샘플 데이터 확인
SELECT 
    user_id,
    reflection1,
    reflection1_completed,
    reflection2, 
    reflection2_completed,
    searched,
    tutorial,
    timestamp,
    created_at
FROM public.reflections 
LIMIT 5;

SELECT '✅ reflections 테이블 스키마 업데이트 완료!' as status;