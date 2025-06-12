import { useCallback } from "react";
import { 
  ImageData, 
  HistoryData 
} from '../../../types/profile';
import { 
  updateClusterImages, 
  saveClusterHistory, 
  saveSliderHistory,
  getCurrentUserId, 
  ensureUserExists 
} from '@/lib/database';

export function useHistorySave({
  positions,
  frameStyles,
  images,
  histories,
  setHistories,
  setCurrentHistoryIndex,
  setIsEditing,
}: {
  positions: Record<string, {x: number, y: number}>;
  frameStyles: Record<string, string>;
  images: ImageData[];
  histories: HistoryData[];
  setHistories: (h: HistoryData[]) => void;
  setCurrentHistoryIndex: (idx: number) => void;
  setIsEditing: (v: boolean) => void;
}) {
  
  // 🆕 localStorage 저장 헬퍼 함수를 useCallback으로 최적화
  const saveToLocalStorageOnly = useCallback(async (userId: string | undefined, updatedHistories: HistoryData[], currentImages: ImageData[]) => {
    try {
      // 사용자별 키 사용
      const historyKey = userId ? `moodboardHistories_${userId}` : 'moodboardHistories';
      const imagesKey = userId ? `profileImages_${userId}` : 'profileImages';
      const sliderKey = userId ? `SliderHistory_${userId}` : 'SliderHistory';
      
      // 히스토리 저장 (moodboard용)
      localStorage.setItem(historyKey, JSON.stringify(updatedHistories));
      console.log(`✅ 사용자별 moodboard 히스토리 localStorage 저장: ${historyKey}`);
      
      // 현재 이미지 상태 저장 (최신으로 교체)
      localStorage.setItem(imagesKey, JSON.stringify(currentImages));
      console.log(`✅ 사용자별 프로필 이미지 localStorage 저장: ${imagesKey}`);

      // 슬라이더 히스토리도 저장
      const sliderHistoryData = {
        timestamp: Date.now(),
        positions,
        frameStyles,
        images: currentImages
      };
      
      const existingSliderHistory = JSON.parse(localStorage.getItem(sliderKey) || '[]');
      const updatedSliderHistory = [...existingSliderHistory, sliderHistoryData];
      localStorage.setItem(sliderKey, JSON.stringify(updatedSliderHistory));
      console.log(`✅ 사용자별 슬라이더 히스토리 localStorage 저장: ${sliderKey}`);
      
    } catch (fallbackError) {
      console.error('localStorage 저장 실패:', fallbackError);
    }
  }, [positions, frameStyles]); // positions와 frameStyles만 의존성으로 추가

  return useCallback(async () => {
    console.log('💾 === 명시적 저장 시작 ===');
    
    const currentTimestamp = Date.now();
    const newHistory = {
      timestamp: currentTimestamp,
      positions,
      frameStyles,
      images: images,
    };
    
    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories as HistoryData[]);
    setIsEditing(false);
    
    console.log('✅ 히스토리 상태 업데이트 완료, DB 저장 시작...');

    // 🆕 DB 역할 분담에 맞는 저장 로직
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.log('❌ 로그인되지 않음, localStorage fallback');
        await saveToLocalStorageOnly(userId, updatedHistories, images);
        return;
      }

      // 사용자 존재 확인
      await ensureUserExists();

      // 🎯 1. cluster_images 저장 (현재 프로필의 최신 클러스터 상태만 유지)
      if (images && images.length > 0) {
        const imageDataForDB = images.map(img => ({
          user_id: userId,
          main_keyword: img.main_keyword,
          keywords: img.keywords || [],
          mood_keyword: img.mood_keyword || '',
          description: img.description || '',
          category: img.category || '',
          sizeWeight: img.sizeWeight || 1,
          src: img.src,
          relatedVideos: img.relatedVideos || [],
          desired_self: img.desired_self || false,
          desired_self_profile: img.desired_self_profile || null,
          metadata: img.metadata || {},
          rotate: img.rotate || 0,
          width: img.width || 300,
          height: img.height || 200,
          left: img.left || '0px',
          top: img.top || '0px',
          position: img.position || { x: 0, y: 0 },
          frameStyle: img.frameStyle || 'normal',
          created_at: new Date().toISOString()
        }));

        await updateClusterImages(userId, imageDataForDB);
        console.log('✅ cluster_images DB 저장 완료 (현재 프로필 최신 상태):', imageDataForDB.length);
      }

      // 🎯 2. cluster_history 저장 (저장된 클러스터 기록 - 누적)
      const clusterHistoryData = images.map(img => ({
        user_id: userId,
        main_keyword: img.main_keyword,
        keywords: img.keywords || [],
        mood_keyword: img.mood_keyword || '',
        description: img.description || '',
        category: img.category || '',
        sizeWeight: img.sizeWeight || 1,
        src: img.src,
        relatedVideos: img.relatedVideos || [],
        desired_self: img.desired_self || false,
        desired_self_profile: img.desired_self_profile || null,
        metadata: { 
          ...img.metadata,
          savedAt: currentTimestamp,
          frameStyle: img.frameStyle,
          position: img.position
        },
        rotate: img.rotate || 0,
        width: img.width || 300,
        height: img.height || 200,
        left: img.left || '0px',
        top: img.top || '0px',
        position: img.position || { x: 0, y: 0 },
        frameStyle: img.frameStyle || 'normal',
        created_at: new Date().toISOString()
      }));

      await saveClusterHistory(clusterHistoryData);
      console.log('✅ cluster_history DB 저장 완료 (저장된 클러스터 기록 - 누적):', clusterHistoryData.length);

      // 🎯 3. slider_history 저장 (슬라이더로 보는 히스토리)
      const sliderHistoryData = {
        user_id: userId,
        version_type: 'self' as const, // 🆕 타입 수정: 사용자가 직접 저장
        nickname: `Saved_${new Date(currentTimestamp).toLocaleString()}`,
        description: `수동 저장 - ${images.length}개 클러스터`,
        images: images.map(img => ({
          ...img,
          position: positions[img.id] || img.position,
          frameStyle: frameStyles[img.id] || img.frameStyle
        }))
      };

      await saveSliderHistory(sliderHistoryData);
      console.log('✅ slider_history DB 저장 완료 (슬라이더용 히스토리)');

      // 🎯 4. 사용자별 localStorage 캐시도 업데이트
      await saveToLocalStorageOnly(userId, updatedHistories, images);
      
      console.log('🎉 명시적 저장 완료 - 3개 테이블 + localStorage 모두 성공');

    } catch (error) {
      console.error('❌ DB 저장 실패, localStorage fallback:', error);
      await saveToLocalStorageOnly(await getCurrentUserId(), updatedHistories, images);
    }
    
  }, [positions, frameStyles, images, histories, setHistories, setCurrentHistoryIndex, setIsEditing]);
} 