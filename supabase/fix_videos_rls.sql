-- Videos 테이블 RLS 정책 수정
-- 캐시 테이블이므로 모든 인증된 사용자가 읽기/쓰기 가능해야 함

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;

-- 새로운 정책 생성
-- 1. 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can view videos" ON public.videos
  FOR SELECT USING (true);

-- 2. 인증된 사용자가 캐시 저장 가능
CREATE POLICY "Authenticated users can manage video cache" ON public.videos
  FOR ALL USING (auth.role() = 'authenticated');

-- 변경사항 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'videos'; 