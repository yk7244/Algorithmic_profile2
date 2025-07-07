//[0] users 테이블 
//[1] WatchHistory 테이블  (비디오들 키워드 분석)
//[2] ClusterHistory 테이블 (AI 클러스터 분석한거 기록)
//[3] ImageData 테이블 (지금 profile에 보이는)
//[4] ProfileData 테이블 (유저 닉네임,설명 정보)
//[5] SliderHistory 테이블 (슬라이더 이미지 기록)

//[0] users 테이블 
export interface UserData {
  id: string;
  email: string;
  background_color: string;
  created_at: string;
  updated_at: string;
  open_to_connect?: boolean; //search_map에서 사용

}

//[1] WatchHistory 테이블 -> upload/VideoAnalysis/videoKeyword.ts 에서 저장함
export interface WatchHistory{
  id: string;
  user_id: string;
  
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  timestamp: string;
}
//[1-2] WatchHistory_array 타입 정의 -> watchHistory 배열 저장용
// (클러스터 분석 과정 살펴볼때 옛날꺼도 보여주기 위함)
export interface WatchHistory_array{
  watchHistory: WatchHistory[];
  timestamp: string;
  clusterHistory_id: string;
}

//[2] ClusterHistory 테이블 -> utils/saveClusterHistory.ts 에서 저장함
export interface ClusterHistory {
  id: string; // UUID/int PK
  user_id: string; // UUID FK

  nickname: string; // 당시의 별명 (ProfileData에서 복사)
  description: string; // 당시의 별명의 설명 (ProfileData에서 복사)

  images: ImageData[]; //profileImages로 복사되거나 ClusterHistory로 복사됨
  created_at: string; // timestamp - 저장 시점
}

//[3]ImageData 테이블->배열 X(지금 profile에 보이는)-> 
export interface ImageData { //ProfileImages(저장명) - ClusterImages(변수명)
  id: string;
  user_id?: string; 

  main_keyword: string;
  keywords: string[]; 
  mood_keyword: string;
  description: string;
  category: string;
  sizeWeight: number; 
  src: string; //update되는 값
  relatedVideos: {
    title: string;
    embedId: string;
  }[];
  desired_self: boolean;
  desired_self_profile: any;
  metadata: any;
  rotate: number;
  width: number;
  height: number;
  left: string;
  top: string;
  position: { //update되는 값
    x: number;
    y: number;
  };
  frameStyle: string; //update되는 값
  created_at: string;
} 

// [4] ProfileData 타입 정의 -> Nickname/useProfileStorage.ts 에서 저장함
export interface ProfileData {
  id: string;
  nickname: string;
  description: string;
  created_at: string;
}

// [5] SliderHistory 테이블 -> utils/saveSliderHistory.ts 에서 저장함
export interface SliderHistory{
  id: string; // UUID/int PK
  user_id: string; // UUID FK
  version_type: 'upload' | 'self'; // "upload" or "self"

  nickname: string; // 당시의 별명 (ProfileData에서 복사)
  description: string; // 당시의 별명의 설명 (ProfileData에서 복사)

  images: ImageData[]; //profileImages로 복사되거나 ClusterHistory로 복사됨
  created_at: string; // timestamp - 저장 시점
}

//[6] ExploreWatchHistory 테이블 
export interface ExploreWatchHistory{
  id: string;
  user_id: string;
  videoId: string;
  title: string;
  description: string; 
  timestamp: string;
}

//[7] ThumbnailData 테이블 
export interface ThumbnailData {
  main_keyword: string;
  src: string;
}

//[8] ReflectionData 테이블 
export interface ReflectionData {
  id: string;
  user_id: string;
  timestamp: string;
  reflection1: boolean;
  reflection2: boolean;
  reflection1_answer:{
    answer1: string;
    answer2: string;
    answer3: string;
  }
  reflection2_answer:{
    answer1: string;
    answer2: string;
  }
}
export interface HistoryData {
  timestamp: number;
  frameStyles: Record<string, string>;
  images: ImageData[];
}

/* 유상님이 만드신 테이블
Table videos { //캐싱 위한거
  id text [pk]
  title text
  description text
  channel_id text
  published_at timestamp
  thumbnail_url text
  view_count bigint
  like_count bigint
  comment_count bigint
  last_fetched_at timestamp
  channel_name text
  url text
  tags text[]
  keywords text[]
}
  
Table users {
  id uuid [pk]
  email text
  created_at timestamp
}

Table moodboard_profiles {
  user_id uuid [pk, ref: > users.id]
  nickname text
  images jsonb
  positions jsonb
  frame_styles jsonb
  updated_at timestamp
}

*/