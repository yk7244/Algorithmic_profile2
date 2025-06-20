import { ImageData } from '../types/profile';
import { arrangeImagesInCenter } from './autoArrange';

// 중앙 위주 좌표 배열 (px 단위)
const centerPositions = [
  { left: '500px', top: '200px' },
  { left: '570px', top: '380px' },
  { left: '380px', top: '420px' },
  { left: '110px', top: '410px' },
  { left: '790px', top: '290px' },
  { left: '30px', top: '400px' },
  { left: '300px', top: '430px' },
  { left: '770px', top: '300px' },
  { left: '200px', top: '170px' }
];

// 이미 사용한 인덱스 추적
let usedIndices: number[] = [];

function getRandomCenterPosition() {
  // 모든 위치를 다 썼으면 초기화
  if (usedIndices.length >= centerPositions.length) {
    usedIndices = [];
  }
  // 남은 인덱스만 추출
  const availableIndices = centerPositions
    .map((_, idx) => idx)
    .filter(idx => !usedIndices.includes(idx));
  // 랜덤 선택
  const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedIndices.push(randomIdx);
  return centerPositions[randomIdx];
}

export const transformClusterToImageData = (
  cluster: any,
  index: number,
  imageUrl: string,
  minStrength: number,
  maxStrength: number
): ImageData => {

  // Step1. 랜덤 회전 생성
  const randomRotate = Math.floor(Math.random() * 12) - 6; // -6 ~ 6도

  // Step2. 영상 데이터 변환
  console.log(`[VideoTransform] Processing cluster "${cluster.main_keyword}". Raw related_videos:`, cluster.related_videos);
  
  const relatedVideos = (Array.isArray(cluster.related_videos) ? cluster.related_videos : []).map((video: any, index: number) => {
    console.log(`[VideoTransform]   - Mapping video #${index}:`, video);
    
    let embedId = video?.videoId || '';
    if (!embedId && typeof video?.url === 'string') {
      if (video.url.includes('v=')) {
        embedId = video.url.split('v=')[1]?.split('&')[0] || '';
      } else {
        // 'v='가 없으면 url 자체가 ID라고 간주
        embedId = video.url;
      }
    }

    console.log(`[VideoTransform]     -> Extracted embedId: "${embedId}"`);
    return {
      title: video?.title || 'Untitled',
      embedId: embedId,
    };
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
    // 위치는 최종 단계에서 할당됨
    left: '0px',
    top: '0px',
    metadata: cluster.metadata || {},

    //추가 
    position: { x: 0, y: 0 },
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
  console.log('➡️ [transform] 1. Received original clusters:', JSON.parse(JSON.stringify(clusters)));
  console.log('➡️ [transform] 2. Received cluster images:', JSON.parse(JSON.stringify(clusterImages)));

  const strengths = clusters.map(c => c.strength || c.metadata?.videoCount || 1);
  const minStrength = Math.min(...strengths);
  const maxStrength = Math.max(...strengths);

  // 1. 이미지 기본 데이터 생성 (위치는 임시)
  const initialImageData = clusters.map((cluster, index) => {
    const imageUrl = clusterImages[index]?.url || placeholderImage;
    return transformClusterToImageData(cluster, index, imageUrl, minStrength, maxStrength);
  });

  // 2. 자동 정렬 로직으로 위치 계산
  const containerWidth = 1000;
  const containerHeight = 680;
  const topMargin = 100;
  const newPositions = arrangeImagesInCenter(initialImageData, containerWidth, containerHeight, topMargin);

  // 3. 계산된 위치를 각 이미지에 할당
  const finalImageData = initialImageData.map(image => {
    const position = newPositions[image.id] || { x: 0, y: 0 };
    return {
      ...image,
      position,
      left: `${position.x}px`,
      top: `${position.y}px`,
    };
  });

  console.log('✅ [transform] 3. Final transformed image data:', JSON.parse(JSON.stringify(finalImageData)));

  return finalImageData;
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

