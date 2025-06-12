//[0] users 테이블 
//[1] WatchHistory 테이블  (비디오들 키워드 분석)
//[2] ClusterHistory 테이블 (AI 클러스터 분석한거 기록)
//[3] ClusterImages 테이블 (지금 profile에 보이는)
//[4] ProfileData 테이블 (유저 닉네임,설명 정보)
//[5] SliderHistory 테이블 (슬라이더 이미지 기록)

//[0] users 테이블 
export interface UserData {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

//[1] WatchHistory 테이블 -> upload/VideoAnalysis/videoKeyword.ts 에서 저장함
export interface WatchHistory{
  id: string;
  user_id: string;
  
  videoId: string;
  title: string;
  description: string;
  tags?: string[]; // 🆕 nullable - explore 시청기록에는 없을 수 있음
  keywords?: string[]; // 🆕 nullable - explore 시청기록에는 없을 수 있음
  source?: 'upload' | 'explore'; // 🆕 시청 출처 구분
  timestamp: string;
}

//[2] ClusterHistory 테이블 -> utils/saveClusterHistory.ts 에서 저장함
export interface ClusterHistory {
  id: string;
  user_id?: string; // 유저 아이디

  main_keyword: string;
  keywords: string[]; //sub_keyword
  mood_keyword: string;
  description: string;
  category: string;
  sizeWeight: number; //strength
  src: string; //main_image_url
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
  position: {
    x: number;
    y: number;
  };
  frameStyle: string; //normal로 고정 
  created_at: string;
}

//[3]ClusterImages 테이블->배열 X(지금 profile에 보이는)-> 
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
  updated_at: string;

  profileImage?: string; //search_map에서 사용
  open_to_connect?: boolean; //search_map에서 사용
  bg_color?: string; //배경색 설정
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

//[6] ExploreWatchHistory 테이블 - 🆕 다시 활성화 (사이트 내 둘러보기 시청 기록)
export interface ExploreWatchHistory{
  id: string;
  user_id: string;
  videoId: string;
  title: string;
  description: string; 
  timestamp: string;
}

export interface VideoData {
  title: string;
  embedId: string;
  description: string;
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