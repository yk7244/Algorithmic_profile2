-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- [0] users 테이블 (Supabase Auth와 연동)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [1] WatchHistory 테이블 (비디오 키워드 분석)
create table public.watch_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  video_id text not null,
  title text not null,
  description text,
  tags text[] default '{}',
  keywords text[] default '{}',
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [2] ClusterHistory 테이블 (AI 클러스터 분석 기록)
create table public.cluster_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  main_keyword text not null,
  keywords text[] default '{}',
  mood_keyword text,
  description text,
  category text,
  size_weight numeric,
  src text, -- main_image_url
  related_videos jsonb default '[]',
  desired_self boolean default false,
  desired_self_profile jsonb,
  metadata jsonb,
  rotate numeric default 0,
  width numeric,
  height numeric,
  left_position text,
  top_position text,
  position_x numeric,
  position_y numeric,
  frame_style text default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [3] ClusterImages 테이블 (현재 프로필에 보이는 이미지)
create table public.cluster_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  main_keyword text not null,
  keywords text[] default '{}',
  mood_keyword text,
  description text,
  category text,
  size_weight numeric,
  src text not null,
  related_videos jsonb default '[]',
  desired_self boolean default false,
  desired_self_profile jsonb,
  metadata jsonb,
  rotate numeric default 0,
  width numeric,
  height numeric,
  left_position text,
  top_position text,
  position_x numeric,
  position_y numeric,
  frame_style text default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [4] ProfileData 테이블 (유저 닉네임, 설명 정보)
create table public.profile_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  nickname text not null,
  description text,
  profile_image text,
  open_to_connect boolean default true,
  bg_color text default 'bg-[#F2F2F2]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [5] SliderHistory 테이블 (슬라이더 이미지 기록)
create table public.slider_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  version_type text check (version_type in ('upload', 'self')) not null,
  nickname text not null,
  description text,
  images jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [6] ExploreWatchHistory 테이블 (탐색용 시청 기록)
create table public.explore_watch_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  video_id text not null,
  title text not null,
  description text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- [7] Videos 테이블 (캐싱용 - 유상님 설계)
create table public.videos (
  id text primary key,
  title text,
  description text,
  channel_id text,
  published_at timestamp with time zone,
  thumbnail_url text,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  last_fetched_at timestamp with time zone default timezone('utc'::text, now()),
  channel_name text,
  url text,
  tags text[] default '{}',
  keywords text[] default '{}'
);

-- RLS (Row Level Security) 정책 설정
alter table public.users enable row level security;
alter table public.watch_history enable row level security;
alter table public.cluster_history enable row level security;
alter table public.cluster_images enable row level security;
alter table public.profile_data enable row level security;
alter table public.slider_history enable row level security;
alter table public.explore_watch_history enable row level security;
alter table public.videos enable row level security;

-- Users 테이블 정책
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- WatchHistory 정책
create policy "Users can view own watch history" on public.watch_history
  for all using (auth.uid() = user_id);

-- ClusterHistory 정책
create policy "Users can view own cluster history" on public.cluster_history
  for all using (auth.uid() = user_id);

-- ClusterImages 정책
create policy "Users can view own cluster images" on public.cluster_images
  for all using (auth.uid() = user_id);

-- ProfileData 정책
create policy "Users can view any profile" on public.profile_data
  for select using (true);

create policy "Users can manage own profile" on public.profile_data
  for all using (auth.uid() = user_id);

-- SliderHistory 정책
create policy "Users can view own slider history" on public.slider_history
  for all using (auth.uid() = user_id);

-- ExploreWatchHistory 정책
create policy "Users can view own explore history" on public.explore_watch_history
  for all using (auth.uid() = user_id);

-- Videos 정책 (모든 사용자가 읽기 가능, 시스템만 쓰기)
create policy "Anyone can view videos" on public.videos
  for select using (true);

-- 사용자 생성 시 자동으로 users 테이블에 레코드 생성하는 함수
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- auth.users 테이블에 새 사용자가 생성될 때 트리거 실행
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 