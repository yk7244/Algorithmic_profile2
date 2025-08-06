-- TubeLens Supabase Database Schema (Original Table Names)
-- 프론트엔드 개발자가 정의한 테이블 이름 그대로 유지
-- 생성 순서: 테이블 간 의존성을 고려하여 순서대로 실행

-- ============================================
-- 1. 사용자 테이블 (기본 Supabase Auth 확장)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL, -- 'google', 'github', 'apple'
  background_color TEXT DEFAULT '#ffffff',
  open_to_connect BOOLEAN DEFAULT false, -- 다른 사용자에게 노출 여부
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 비디오 캐시 테이블 (YouTube API 결과 캐싱)
-- ============================================
CREATE TABLE public.videos (
  id TEXT PRIMARY KEY, -- YouTube video ID
  title TEXT NOT NULL,
  description TEXT,
  channel_id TEXT,
  channel_name TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  url TEXT,
  tags TEXT[],
  keywords TEXT[],
  last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 사용자 프로필 테이블 (AI 생성 닉네임/설명)
-- ============================================
CREATE TABLE public.ProfileData (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  description TEXT NOT NULL, -- main_description -> description으로 원래 필드명 유지
  background_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT true, -- 현재 활성 프로필 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 시청 기록 테이블 (사용자별 YouTube 분석 데이터)
-- ============================================
CREATE TABLE public.WatchHistory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  videoId TEXT REFERENCES public.videos(id), -- 원래 필드명 그대로
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  keywords TEXT[], -- AI 추출 키워드
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 원래 필드명 그대로
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 클러스터 분석 테이블 (AI 분석 결과)
-- ============================================
CREATE TABLE public.ClusterHistory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.ProfileData(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL, -- 당시 닉네임 스냅샷
  description TEXT NOT NULL, -- 당시 설명 스냅샷
  images JSONB NOT NULL, -- ImageData[] 배열 저장
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 이미지 데이터 테이블 (무드보드 이미지)
-- ============================================
CREATE TABLE public.ImageData (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.ClusterHistory(id) ON DELETE CASCADE,
  
  -- 키워드 정보
  main_keyword TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  mood_keyword TEXT,
  description TEXT,
  category TEXT,
  
  -- 이미지 정보
  src TEXT NOT NULL, -- image_url -> src로 원래 필드명 유지
  width INTEGER DEFAULT 200,
  height INTEGER DEFAULT 200,
  sizeWeight DECIMAL DEFAULT 1.0, -- size_weight -> sizeWeight로 원래 필드명 유지
  
  -- 위치 정보 (무드보드 상의 위치)
  position JSONB DEFAULT '{"x": 0, "y": 0}', -- {x, y} 객체로 저장
  rotate DECIMAL DEFAULT 0,
  "left" TEXT, -- CSS 위치값 (예약어라서 따옴표 필요)
  "top" TEXT,  -- CSS 위치값 (예약어라서 따옴표 필요)
  
  -- 스타일 정보
  frameStyle TEXT DEFAULT 'normal', -- frame_style -> frameStyle로 원래 필드명 유지
  
  -- 관련 비디오
  relatedVideos JSONB DEFAULT '[]', -- related_videos -> relatedVideos로 원래 필드명 유지
  
  -- 특별 플래그
  desired_self BOOLEAN DEFAULT false,
  desired_self_profile JSONB,
  
  -- 메타데이터
  metadata JSONB DEFAULT '{}',
  similarity DECIMAL, -- 유사도 점수
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. 슬라이더 히스토리 테이블 (무드보드 변경 이력)
-- ============================================
CREATE TABLE public.SliderHistory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  version_type TEXT CHECK (version_type IN ('upload', 'self')) NOT NULL,
  
  -- 당시 상태 스냅샷
  nickname TEXT NOT NULL,
  description TEXT NOT NULL,
  images JSONB NOT NULL, -- ImageData[] 배열
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. 리플렉션 데이터 테이블 (사용자 피드백)
-- ============================================
CREATE TABLE public.ReflectionData (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 리플렉션 상태
  reflection1 BOOLEAN DEFAULT false,
  reflection2 BOOLEAN DEFAULT false,
  searched BOOLEAN DEFAULT false, -- 검색 기능 사용 여부
  tutorial BOOLEAN DEFAULT false,
  
  -- 리플렉션 답변
  reflection1_answer JSONB, -- {answer1, answer2, answer3}
  reflection2_answer JSONB, -- {answer1, answer2}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. 리플렉션 답변 이전 기록 테이블
-- ============================================
CREATE TABLE public.Reflection_answer (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reflection_data JSONB NOT NULL, -- ReflectionData[] 배열
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. 썸네일 데이터 테이블 (이미지 검색 결과 캐싱)
-- ============================================
CREATE TABLE public.ThumbnailData (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  main_keyword TEXT NOT NULL,
  src TEXT NOT NULL, -- image_url -> src로 원래 필드명 유지
  search_query TEXT,
  source TEXT, -- 'naver', 'google', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(main_keyword, search_query)
);

-- ============================================
-- 11. 파싱 히스토리 테이블 (업로드된 시청 기록 원본)
-- ============================================
CREATE TABLE public.ParseHistory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  channel TEXT,
  date TEXT, -- 원본 형식 유지
  keyword TEXT[],
  tags TEXT[],
  title TEXT,
  videoId TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. WatchHistory 배열 테이블 (클러스터 분석 과정용)
-- ============================================
CREATE TABLE public.WatchHistory_array (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  watchHistory JSONB NOT NULL, -- WatchHistory[] 배열
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clusterHistory_id UUID REFERENCES public.ClusterHistory(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. 인덱스 생성 (성능 최적화)
-- ============================================

-- 사용자 관련 인덱스
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_provider ON public.users(provider);

-- 프로필 관련 인덱스
CREATE INDEX idx_ProfileData_user_id ON public.ProfileData(user_id);
CREATE INDEX idx_ProfileData_active ON public.ProfileData(user_id, is_active) WHERE is_active = true;

-- 시청 기록 관련 인덱스
CREATE INDEX idx_WatchHistory_user_id ON public.WatchHistory(user_id);
CREATE INDEX idx_WatchHistory_videoId ON public.WatchHistory(videoId);
CREATE INDEX idx_WatchHistory_timestamp ON public.WatchHistory(timestamp DESC);

-- 클러스터 분석 관련 인덱스
CREATE INDEX idx_ClusterHistory_user_id ON public.ClusterHistory(user_id);
CREATE INDEX idx_ClusterHistory_created_at ON public.ClusterHistory(created_at DESC);

-- 이미지 데이터 관련 인덱스
CREATE INDEX idx_ImageData_user_id ON public.ImageData(user_id);
CREATE INDEX idx_ImageData_cluster_id ON public.ImageData(cluster_id);
CREATE INDEX idx_ImageData_main_keyword ON public.ImageData(main_keyword);

-- 슬라이더 히스토리 관련 인덱스
CREATE INDEX idx_SliderHistory_user_id ON public.SliderHistory(user_id);
CREATE INDEX idx_SliderHistory_created_at ON public.SliderHistory(created_at DESC);

-- 리플렉션 관련 인덱스
CREATE INDEX idx_ReflectionData_user_id ON public.ReflectionData(user_id);
CREATE INDEX idx_Reflection_answer_user_id ON public.Reflection_answer(user_id);

-- 썸네일 캐시 관련 인덱스
CREATE INDEX idx_ThumbnailData_main_keyword ON public.ThumbnailData(main_keyword);

-- 파싱 히스토리 관련 인덱스
CREATE INDEX idx_ParseHistory_user_id ON public.ParseHistory(user_id);
CREATE INDEX idx_ParseHistory_videoId ON public.ParseHistory(videoId);

-- ============================================
-- 14. RLS (Row Level Security) 정책
-- ============================================

-- 사용자 테이블 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 프로필 테이블 RLS
ALTER TABLE public.ProfileData ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ProfileData" ON public.ProfileData FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public ProfileData are readable" ON public.ProfileData FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE open_to_connect = true)
);

-- 시청 기록 테이블 RLS
ALTER TABLE public.WatchHistory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own WatchHistory" ON public.WatchHistory FOR ALL USING (auth.uid() = user_id);

-- 클러스터 분석 테이블 RLS
ALTER TABLE public.ClusterHistory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ClusterHistory" ON public.ClusterHistory FOR ALL USING (auth.uid() = user_id);

-- 이미지 데이터 테이블 RLS
ALTER TABLE public.ImageData ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ImageData" ON public.ImageData FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public ImageData are readable" ON public.ImageData FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE open_to_connect = true)
);

-- 슬라이더 히스토리 테이블 RLS
ALTER TABLE public.SliderHistory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own SliderHistory" ON public.SliderHistory FOR ALL USING (auth.uid() = user_id);

-- 리플렉션 테이블 RLS
ALTER TABLE public.ReflectionData ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ReflectionData" ON public.ReflectionData FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.Reflection_answer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own Reflection_answer" ON public.Reflection_answer FOR ALL USING (auth.uid() = user_id);

-- 파싱 히스토리 테이블 RLS
ALTER TABLE public.ParseHistory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ParseHistory" ON public.ParseHistory FOR ALL USING (auth.uid() = user_id);

-- WatchHistory 배열 테이블 RLS
ALTER TABLE public.WatchHistory_array ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own WatchHistory_array" ON public.WatchHistory_array FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 15. 트리거 함수 (자동 업데이트)
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ProfileData_updated_at BEFORE UPDATE ON public.ProfileData FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ImageData_updated_at BEFORE UPDATE ON public.ImageData FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ReflectionData_updated_at BEFORE UPDATE ON public.ReflectionData FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. 제약 조건 및 초기 설정
-- ============================================

-- 사용자당 하나의 활성 프로필만 허용
CREATE UNIQUE INDEX idx_one_active_ProfileData_per_user ON public.ProfileData(user_id) WHERE is_active = true;

-- 비디오 테이블에 고유 제약 조건
ALTER TABLE public.videos ADD CONSTRAINT unique_video_id UNIQUE (id);

-- 썸네일 캐시 만료 기간 설정 (30일)
CREATE OR REPLACE FUNCTION cleanup_old_thumbnails()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ThumbnailData 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 오래된 썸네일 캐시 정리 (cron extension 필요)
-- SELECT cron.schedule('cleanup-thumbnails', '0 0 * * *', 'SELECT cleanup_old_thumbnails();');