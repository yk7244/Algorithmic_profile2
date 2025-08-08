-- 알고리즘 시각화 공개 설정 기본값을 true로 변경
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. 기존 사용자들의 open_to_connect를 true로 변경 (선택사항)
-- 모든 기존 사용자의 공개 설정을 true로 변경하려면 아래 주석을 해제하세요
-- UPDATE public.users SET open_to_connect = true WHERE open_to_connect = false;

-- 2. users 테이블의 기본값을 true로 변경
ALTER TABLE public.users ALTER COLUMN open_to_connect SET DEFAULT true;

-- 3. 현재 로그인한 사용자만 true로 변경 (개별 적용)
-- 현재 인증된 사용자의 설정만 변경하려면 아래를 실행하세요
UPDATE public.users 
SET open_to_connect = true 
WHERE id = auth.uid();

-- 확인용 쿼리 (현재 사용자 정보 조회)
SELECT id, email, nickname, open_to_connect, created_at 
FROM public.users 
WHERE id = auth.uid();

-- 성공 메시지
SELECT '알고리즘 시각화 공개 설정이 기본값 true로 변경되었습니다!' as status;