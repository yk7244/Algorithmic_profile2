-- TubeLens Supabase Database Schema (Clean PostgreSQL Version)
-- PostgreSQL 규칙에 따른 snake_case 테이블명 사용
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
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  main_description TEXT NOT NULL,
  background_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT true, -- 현재 활성 프로필 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 시청 기록 테이블 (사용자별 YouTube 분석 데이터)
-- ============================================
CREATE TABLE public.watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT REFERENCES public.videos(id),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  keywords TEXT[], -- AI 추출 키워드
  watch_date TIMESTAMP WITH TIME ZONE,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 클러스터 분석 테이블 (AI 분석 결과)
-- ============================================
CREATE TABLE public.cluster_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL, -- 당시 닉네임 스냅샷
  description TEXT NOT NULL, -- 당시 설명 스냅샷
  images_data JSONB NOT NULL, -- ImageData[] 배열 저장
  analysis_data JSONB, -- 추가 분석 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 이미지 데이터 테이블 (무드보드 이미지)
-- ============================================
CREATE TABLE public.image_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES public.cluster_history(id) ON DELETE CASCADE,
  
  -- 키워드 정보
  main_keyword TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  mood_keyword TEXT,
  description TEXT,
  category TEXT,
  
  -- 이미지 정보
  image_url TEXT NOT NULL,
  width INTEGER DEFAULT 200,
  height INTEGER DEFAULT 200,
  size_weight DECIMAL DEFAULT 1.0,
  
  -- 위치 정보 (무드보드 상의 위치)
  position_x DECIMAL DEFAULT 0,
  position_y DECIMAL DEFAULT 0,
  rotate DECIMAL DEFAULT 0,
  css_left TEXT, -- CSS 위치값 (left는 예약어라서 css_left로 변경)
  css_top TEXT,  -- CSS 위치값 (top도 예약어 가능성 있어서 css_top으로 변경)
  
  -- 스타일 정보
  frame_style TEXT DEFAULT 'normal', -- 'normal', 'cokie', etc.
  
  -- 관련 비디오
  related_videos JSONB DEFAULT '[]', -- [{title, embedId}]
  
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
CREATE TABLE public.slider_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  version_type TEXT CHECK (version_type IN ('upload', 'self')) NOT NULL,
  
  -- 당시 상태 스냅샷
  nickname TEXT NOT NULL,
  description TEXT NOT NULL,
  background_color TEXT,
  images_data JSONB NOT NULL, -- ImageData[] 배열
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. 리플렉션 데이터 테이블 (사용자 피드백)
-- ============================================
CREATE TABLE public.reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 리플렉션 상태
  reflection1_completed BOOLEAN DEFAULT false,
  reflection2_completed BOOLEAN DEFAULT false,
  searched BOOLEAN DEFAULT false, -- 검색 기능 사용 여부
  tutorial_completed BOOLEAN DEFAULT false,
  
  -- 리플렉션 답변
  reflection1_answers JSONB, -- {answer1, answer2, answer3}
  reflection2_answers JSONB, -- {answer1, answer2}
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. 리플렉션 답변 이전 기록 테이블
-- ============================================
CREATE TABLE public.reflection_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reflection_data JSONB NOT NULL, -- ReflectionData[] 배열
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. 썸네일 캐시 테이블 (이미지 검색 결과 캐싱)
-- ============================================
CREATE TABLE public.thumbnail_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  main_keyword TEXT NOT NULL,
  image_url TEXT NOT NULL,
  search_query TEXT,
  source TEXT, -- 'naver', 'google', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(main_keyword, search_query)
);

-- ============================================
-- 11. 파싱 히스토리 테이블 (업로드된 시청 기록 원본)
-- ============================================
CREATE TABLE public.parse_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  channel TEXT,
  date TEXT, -- 원본 형식 유지
  keyword TEXT[],
  tags TEXT[],
  title TEXT,
  video_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. WatchHistory 배열 테이블 (클러스터 분석 과정용)
-- ============================================
CREATE TABLE public.watch_history_arrays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  watch_history_data JSONB NOT NULL, -- WatchHistory[] 배열
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cluster_history_id UUID REFERENCES public.cluster_history(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. 인덱스 생성 (성능 최적화)
-- ============================================

-- 사용자 관련 인덱스
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_provider ON public.users(provider);

-- 프로필 관련 인덱스
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_active ON public.profiles(user_id, is_active) WHERE is_active = true;

-- 시청 기록 관련 인덱스
CREATE INDEX idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX idx_watch_history_video_id ON public.watch_history(video_id);
CREATE INDEX idx_watch_history_analysis_date ON public.watch_history(analysis_date DESC);

-- 클러스터 분석 관련 인덱스
CREATE INDEX idx_cluster_history_user_id ON public.cluster_history(user_id);
CREATE INDEX idx_cluster_history_created_at ON public.cluster_history(created_at DESC);

-- 이미지 데이터 관련 인덱스
CREATE INDEX idx_image_data_user_id ON public.image_data(user_id);
CREATE INDEX idx_image_data_cluster_id ON public.image_data(cluster_id);
CREATE INDEX idx_image_data_main_keyword ON public.image_data(main_keyword);

-- 슬라이더 히스토리 관련 인덱스
CREATE INDEX idx_slider_history_user_id ON public.slider_history(user_id);
CREATE INDEX idx_slider_history_created_at ON public.slider_history(created_at DESC);

-- 리플렉션 관련 인덱스
CREATE INDEX idx_reflections_user_id ON public.reflections(user_id);
CREATE INDEX idx_reflection_answers_user_id ON public.reflection_answers(user_id);

-- 썸네일 캐시 관련 인덱스
CREATE INDEX idx_thumbnail_cache_keyword ON public.thumbnail_cache(main_keyword);

-- 파싱 히스토리 관련 인덱스
CREATE INDEX idx_parse_history_user_id ON public.parse_history(user_id);
CREATE INDEX idx_parse_history_video_id ON public.parse_history(video_id);

-- ============================================
-- 14. RLS (Row Level Security) 정책
-- ============================================

-- 사용자 테이블 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 프로필 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profiles" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE open_to_connect = true)
);

-- 시청 기록 테이블 RLS
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

-- 클러스터 분석 테이블 RLS
ALTER TABLE public.cluster_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cluster history" ON public.cluster_history FOR ALL USING (auth.uid() = user_id);

-- 이미지 데이터 테이블 RLS
ALTER TABLE public.image_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own images" ON public.image_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public images are readable" ON public.image_data FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE open_to_connect = true)
);

-- 슬라이더 히스토리 테이블 RLS
ALTER TABLE public.slider_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own slider history" ON public.slider_history FOR ALL USING (auth.uid() = user_id);

-- 리플렉션 테이블 RLS
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reflections" ON public.reflections FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.reflection_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reflection answers" ON public.reflection_answers FOR ALL USING (auth.uid() = user_id);

-- 파싱 히스토리 테이블 RLS
ALTER TABLE public.parse_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own parse history" ON public.parse_history FOR ALL USING (auth.uid() = user_id);

-- WatchHistory 배열 테이블 RLS
ALTER TABLE public.watch_history_arrays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watch history arrays" ON public.watch_history_arrays FOR ALL USING (auth.uid() = user_id);

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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_data_updated_at BEFORE UPDATE ON public.image_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON public.reflections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. 제약 조건 및 초기 설정
-- ============================================

-- 사용자당 하나의 활성 프로필만 허용
CREATE UNIQUE INDEX idx_one_active_profile_per_user ON public.profiles(user_id) WHERE is_active = true;

-- 비디오 테이블에 고유 제약 조건
ALTER TABLE public.videos ADD CONSTRAINT unique_video_id UNIQUE (id);

-- 썸네일 캐시 만료 기간 설정 (30일)
CREATE OR REPLACE FUNCTION cleanup_old_thumbnails()
RETURNS void AS $$
BEGIN
  DELETE FROM public.thumbnail_cache 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 오래된 썸네일 캐시 정리 (cron extension 필요)
-- SELECT cron.schedule('cleanup-thumbnails', '0 0 * * *', 'SELECT cleanup_old_thumbnails();');