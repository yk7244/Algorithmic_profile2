import { ImageData } from '../types/profile';

// 중앙 위주 좌표 배열 (px 단위)
const centerPositions = [
  { left: '400px', top: '400px' },
  { left: '420px', top: '380px' },
  { left: '380px', top: '420px' },
  { left: '410px', top: '410px' },
  { left: '390px', top: '390px' },
  { left: '430px', top: '400px' },
  { left: '400px', top: '430px' },
  { left: '370px', top: '400px' },
  { left: '400px', top: '370px' }
];

function getRandomCenterPosition() {
  const randomIndex = Math.floor(Math.random() * centerPositions.length);
  return centerPositions[randomIndex];
}

export const transformClusterToImageData = (
  cluster: any,
  index: number,
  imageUrl: string,
  minStrength: number,
  maxStrength: number
): ImageData => {

  // Step1. 랜덤 위치 및 회전 생성
  const randomRotate = Math.floor(Math.random() * 12) - 6; // -6 ~ 6도
  // 중앙 위주 랜덤 위치
  const { left, top } = getRandomCenterPosition();

  // Step2. 영상 데이터 변환
  const relatedVideos = cluster.related_videos?.map((video: any) => ({
    title: video.title,
    embedId: video.videoId || video.url?.split('v=')[1] || ''
  })) || [];

  // Step4. 키워드 리스트 변환
  const keywords = cluster.keyword_list?.split(',').map((k: string) => k.trim()) || [];

  // Step5. strength 기반으로 sizeWeight 계산 (동적 min/max)
  const strength = cluster.strength || cluster.metadata?.videoCount || 1;
  let sizeWeight = 0.05; // 기본값
  if (maxStrength > minStrength) {
    // 0.005 ~ 0.05 사이로 정규화
    const ratio = (strength - minStrength) / (maxStrength - minStrength);
    sizeWeight = 0.005 + ratio * (0.05 - 0.005);
  }

  return {
    id: String(index + 1),
    src: imageUrl,
    main_keyword: cluster.main_keyword,
    mood_keyword: cluster.mood_keyword || '',
    description: cluster.description || '',
    category: cluster.category?.toLowerCase() || 'other',
    width: 800,
    height: 800,
    rotate: 0,
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

// 여러 클러스터를 한 번에 변환하며, min/max strength를 내부에서 계산
const placeholderImage = '/images/default_image.png';

export function transformClustersToImageData(
  clusters: any[],
  clusterImages: Record<number, any>
): ImageData[] {
  const strengths = clusters.map(c => c.strength || c.metadata?.videoCount || 1);
  const minStrength = Math.min(...strengths);
  const maxStrength = Math.max(...strengths);

  return clusters.map((cluster, index) => {
    // Step6. 이미지 데이터 변환
    const imageUrl = clusterImages[index]?.url || placeholderImage;
    return transformClusterToImageData(cluster, index, imageUrl, minStrength, maxStrength);
  });
}

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

