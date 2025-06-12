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
    embedId: video.embedId || video.videoId || video.url?.split('v=')[1] || ''
  })) || [];

  // 🆕 디버깅용 로깅 추가
  console.log('🔧 [transformClusterToImageData] relatedVideos 변환:', {
    'cluster.main_keyword': cluster.main_keyword,
    'cluster.related_videos (원본)': cluster.related_videos,
    'relatedVideos (변환 후)': relatedVideos,
    '변환된 영상 수': relatedVideos.length,
    '유효한 embedId 수': relatedVideos.filter((v: any) => v.embedId).length
  });

  // Step4. 키워드 리스트 변환
  const keywords = cluster.keyword_list?.split(',').map((k: string) => k.trim()) || [];

  // Step5. strength 기반으로 sizeWeight 계산 (동적 min/max)
  const strength = cluster.strength || cluster.metadata?.videoCount || 1;
  let sizeWeight = 0.02; // 기본값
  if (maxStrength > minStrength) {
    // 0.015 ~ 0.03 사이로 정규화
    const ratio = (strength - minStrength) / (maxStrength - minStrength);
    sizeWeight = 0.015 + ratio * (0.03 - 0.01);
  } else {
    // 모든 strength가 동일한 경우 중간값 사용
    sizeWeight = (0.015 + 0.03) / 2; // 0.0275
  }

  return {
    id: String(index + 1),
    src: imageUrl,
    main_keyword: cluster.main_keyword,
    mood_keyword: cluster.mood_keyword || '',
    description: cluster.description || '',
    category: cluster.category?.toLowerCase() || 'other',
    keywords: keywords.slice(0, 5),
    relatedVideos: relatedVideos.slice(0, 5),
    sizeWeight,

    desired_self: false,
    desired_self_profile: null,

    width: 800,
    height: 800,
    rotate: 0,
    left,
    top,
    metadata: cluster.metadata || {},

    //추가 
    position: {
      x: Number(left.replace('px', '')),
      y: Number(top.replace('px', ''))
    },
    frameStyle: 'normal',
    created_at: cluster.created_at || new Date().toISOString()
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

