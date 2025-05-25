import { ImageData } from '../types/profile';

// 중앙 위주 좌표 배열 (CSS 퍼센트 단위)
const centerPositions = [
  { left: "50%", top: "50%" },
  { left: "52%", top: "48%" },
  { left: "48%", top: "52%" },
  { left: "51%", top: "51%" },
  { left: "49%", top: "49%" },
  { left: "53%", top: "50%" },
  { left: "50%", top: "53%" },
  { left: "47%", top: "50%" },
  { left: "50%", top: "47%" }
];

function getRandomCenterPosition() {
  const randomIndex = Math.floor(Math.random() * centerPositions.length);
  return centerPositions[randomIndex];
}

export const transformClusterToImageData = (
  cluster: any,
  index: number,
  imageUrl: string
): ImageData => {
  // 랜덤 위치 및 회전 생성
  const randomRotate = Math.floor(Math.random() * 12) - 6; // -6 ~ 6도

  // 중앙 위주 랜덤 위치
  const { left, top } = getRandomCenterPosition();

  // 영상 데이터 변환
  const relatedVideos = cluster.related_videos?.map((video: any) => ({
    title: video.title,
    embedId: video.videoId || video.url?.split('v=')[1] || ''
  })) || [];

  // 키워드 리스트 변환
  const keywords = cluster.keyword_list?.split(',').map((k: string) => k.trim()) || [];

  // strength 기반으로 sizeWeight 계산
  // strength가 높을수록 크기가 커지도록 설정 (0.05 ~ 0.3 범위)
  const strength = cluster.strength || cluster.metadata?.videoCount || 1;
  const maxStrength = 10; // 예상되는 최대 strength 값
  const sizeWeight = Math.min(0.05 + (strength / maxStrength) * 0.15, 0.3);

  return {
    id: String(index + 1),
    src: imageUrl,
    main_keyword: cluster.main_keyword,
    mood_keyword: cluster.mood_keyword || '',
    description: cluster.description || '',
    category: cluster.category?.toLowerCase() || 'other',
    width: 800,
    height: 800,
    rotate: randomRotate,
    left,
    top,
    keywords: keywords.slice(0, 5),
    sizeWeight,
    relatedVideos: relatedVideos.slice(0, 5),
    created_at: cluster.created_at || new Date().toISOString(),
    desired_self: false,
    metadata: cluster.metadata || {},
    desired_self_profile: null
  };
}; 

//localstorage->watchClusters 에 배열로 들어감
type Cluster = {
  id?: number;
  user_id?: string;

  main_keyword: string;
  mood_keyword: string;
  description: string;
  category: Category;  // 카테고리 필드 추가
  
  rotation?: string;
  keyword_list: string;
  strength: number;
  video_links: string;
  created_at: string;
  desired_self: boolean;

  main_image_url?: string;
  metadata: any;
};

// 클러스터 타입 수정
type Category = 
  | "영화/애니메이션"
  | "자동차"
  | "음악"
  | "동물"
  | "스포츠"
  | "여행/이벤트"
  | "게임"
  | "사람/블로그"
  | "코미디"
  | "엔터테인먼트"
  | "뉴스/정치"
  | "노하우/스타일"
  | "교육"
  | "과학/기술"
  | "비영리 활동";

