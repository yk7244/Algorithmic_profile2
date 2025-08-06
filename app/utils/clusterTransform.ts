import { ImageData } from '../types/profile';
import { arrangeImagesInCenter } from './autoArrange';
import { saveClusterHistory } from './save/saveClusterHistory'; 
import { saveSliderHistory } from './save/saveSliderHistory'; 
import { saveProfileImages } from './save/saveImageData';
import { saveWatchHistory_array } from './save/saveWatchHistory_array';

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

export const transform = (
  cluster: any,
  index: number,
  imageUrl: string,
  minStrength: number,
  maxStrength: number
): ImageData => {
 
  const relatedVideos = cluster.related_videos;
  const keywords = cluster.keyword_list?.split(',').map((k: string) => k.trim()) || [];

  //strength 기반으로 sizeWeight 계산 (동적 min/max)
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

  //위치

  return {
    id: String(index + 1),
    src: imageUrl,
    main_keyword: cluster.main_keyword,
    mood_keyword: cluster.mood_keyword || '',
    description: cluster.description || '',
    category: cluster.category?.toLowerCase() || 'other',
    keywords: keywords,
    relatedVideos: relatedVideos,
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

const placeholderImage = '/images/default_image.png';

// ✅ 중복 실행 방지를 위한 플래그
let isTransforming = false;

export async function transformClustersToImageData(clusters: any[]): Promise<ImageData[]> {
  try {
    // ✅ 중복 실행 방지
    if (isTransforming) {
      console.warn('⚠️ transformClustersToImageData가 이미 실행 중입니다. 중복 실행을 방지합니다.');
      return [];
    }
    
    isTransforming = true;
    console.log('🔄 transformClustersToImageData 시작 - 중복 실행 방지 플래그 설정');
    
    const clusterArray = Array.isArray(clusters) ? clusters : [clusters];

    const strengths = clusterArray.map(c => c.strength || c.metadata?.videoCount || 1);
    const minStrength = Math.min(...strengths);
    const maxStrength = Math.max(...strengths);

    console.log('✅ 받아온 클러스터', clusterArray.length, '개');
  
  console.log('🔄 1단계: initialImageData 생성 시작');
  const initialImageData = clusterArray.map((cluster, index) => {
    const imageUrl = cluster.thumbnailUrl || placeholderImage;  //thumbnailUrl 없으면 placeholderImage 사용
    return transform(cluster, index, imageUrl, minStrength, maxStrength);
  });
  console.log('✅ 1단계 완료: initialImageData 생성됨', initialImageData.length, '개');

  console.log('🔄 2단계: 컨테이너 크기 계산');
  // ✅ 반응형 컨테이너 크기 (기본값을 더 넓게)
  const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.8, 1200) : 1000;
  const containerHeight = 680;
  const topMargin = 100;
  console.log('✅ 2단계 완료: 컨테이너 크기', { containerWidth, containerHeight, topMargin });

  console.log('🔄 3단계: arrangeImagesInCenter 호출');
  const newPositions = arrangeImagesInCenter(initialImageData, containerWidth, containerHeight, topMargin);
  console.log('✅ 3단계 완료: 위치 배치됨', Object.keys(newPositions).length, '개');

  console.log('🔄 4단계: finalImageData 생성');
  const finalImageData = initialImageData.map(image => {
    const position = newPositions[image.id] || { x: 0, y: 0 };
    return {
      ...image,
      position,
      left: `${position.x}px`,
      top: `${position.y}px`,
    };
  });
  console.log('✅ 4단계 완료: finalImageData 생성됨', finalImageData.length, '개');

  console.log('🔄 5단계: saveProfileImages 호출');
  const saveProfileImagesStartTime = Date.now();
  
  try {
    // ✅ saveProfileImages에 추가 타임아웃 적용 (45초)
    const saveImageSuccess = await Promise.race([
      saveProfileImages(finalImageData),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('saveProfileImages 전체 타임아웃 (45초)')), 45000)
      )
    ]);
    
    const saveProfileImagesElapsed = Date.now() - saveProfileImagesStartTime;
    console.log(`⏱️ saveProfileImages 완료: ${saveProfileImagesElapsed}ms, 성공: ${saveImageSuccess}`);
    
    if (saveImageSuccess) {
      console.log('✅ 5단계 완료: saveProfileImages 저장 성공');
    } else {
      console.warn('⚠️ 5단계 경고: saveProfileImages 저장 실패했지만 계속 진행');
    }
  } catch (saveImageError) {
    const saveProfileImagesElapsed = Date.now() - saveProfileImagesStartTime;
    console.error(`❌ 5단계 실패: saveProfileImages 에러 (${saveProfileImagesElapsed}ms):`, saveImageError);
    
    if (saveImageError instanceof Error && saveImageError.message.includes('타임아웃')) {
      console.error('🚨 saveProfileImages 타임아웃 - 45초 초과, 하지만 다음 단계 계속 진행');
    }
    
    // ✅ saveProfileImages 실패해도 다음 단계는 계속 진행
    console.log('🔄 saveProfileImages 실패했지만 나머지 히스토리 저장은 계속 진행합니다...');
  }
  
  // ✅ 6단계: saveClusterHistory (에러 처리 강화)
  console.log('🔄 6단계: saveClusterHistory 호출 시작');
  let clusterHistoryResult = { success: false };
  try {
    clusterHistoryResult = await saveClusterHistory(finalImageData);
    console.log('✅ 6단계 완료: saveClusterHistory 결과', clusterHistoryResult);
  } catch (clusterHistoryError) {
    console.error('❌ 6단계 실패: saveClusterHistory 에러:', clusterHistoryError);
    console.log('🔄 6단계 실패했지만 다음 단계 계속 진행...');
  }
  
  // ✅ 7단계: saveSliderHistory (에러 처리 강화)
  console.log('🔄 7단계: saveSliderHistory 호출 시작');
  let sliderResult = { success: false };
  try {
    sliderResult = await saveSliderHistory('upload'); // 업로드 완료 시 'upload' 타입으로 저장
    console.log('✅ 7단계 완료: saveSliderHistory 결과', sliderResult);
  } catch (sliderError) {
    console.error('❌ 7단계 실패: saveSliderHistory 에러:', sliderError);
    console.log('🔄 7단계 실패했지만 다음 단계 계속 진행...');
  }
  
  // ✅ 8단계: saveWatchHistory_array (에러 처리 강화)
  console.log('🔄 8단계: saveWatchHistory_array 호출 시작');
  let watchHistoryResult = { success: false };
  try {
    watchHistoryResult = await saveWatchHistory_array();
    console.log('✅ 8단계 완료: saveWatchHistory_array 결과', watchHistoryResult);
  } catch (watchHistoryError) {
    console.error('❌ 8단계 실패: saveWatchHistory_array 에러:', watchHistoryError);
    console.log('🔄 8단계 실패했지만 최종 단계 계속 진행...');
  }

  console.log('🔄 9단계: 최종 검증 및 반환');
  if (clusterHistoryResult.success && sliderResult.success && watchHistoryResult.success) {
    console.log('✨ 모든 히스토리 저장 성공!', { clusterHistoryResult, sliderResult, watchHistoryResult });
  } else {
    console.warn('⚠️ 일부 히스토리 저장 실패:', { 
      clusterHistory: clusterHistoryResult?.success, 
      slider: sliderResult?.success, 
      watchHistory: watchHistoryResult?.success 
    });
  }

    console.log('✅ 9단계 완료: finalImageData 반환', finalImageData.length, '개');
    return finalImageData;
    
  } catch (error) {
    console.error('❌ transformClustersToImageData 실행 중 에러 발생:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 에러가 발생해도 빈 배열 대신 기본 데이터라도 반환
    try {
      console.log('🔄 에러 복구: 기본 이미지 데이터 생성 시도');
      const clusterArray = Array.isArray(clusters) ? clusters : [clusters];
      const basicImageData = clusterArray.map((cluster, index) => ({
        id: `cluster-${index}`,
        main_keyword: cluster.main_keyword || `클러스터 ${index + 1}`,
        keywords: cluster.keywords || [],
        mood_keyword: cluster.mood_keyword || '기본',
        description: cluster.description || '클러스터 설명',
        category: cluster.category || 'general',
        sizeWeight: 0.02,
        src: placeholderImage,
        relatedVideos: cluster.related_videos || [],
        desired_self: false,
        desired_self_profile: null,
        metadata: cluster,
        rotate: 0,
        width: 200,
        height: 200,
        left: `${100 + index * 50}px`,
        top: `${100 + index * 50}px`,
        position: { x: 100 + index * 50, y: 100 + index * 50 },
        frameStyle: 'default',
        created_at: new Date().toISOString()
      }));
      
      console.log('✅ 에러 복구: 기본 이미지 데이터 생성 완료', basicImageData.length, '개');
      return basicImageData;
    } catch (recoveryError) {
      console.error('❌ 에러 복구도 실패:', recoveryError);
      return [];
    }
  } finally {
    // ✅ 성공하든 실패하든 플래그 해제
    isTransforming = false;
    console.log('🔄 transformClustersToImageData 완료 - 중복 실행 방지 플래그 해제');
  }
}

