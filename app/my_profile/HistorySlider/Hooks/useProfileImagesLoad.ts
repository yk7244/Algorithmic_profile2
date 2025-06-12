import { useEffect, useRef } from 'react';
import { ImageData } from '../../../types/profile';
import { getClusterImages, getCurrentUserId } from '@/lib/database';

interface UseProfileImagesLoadProps {
setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
setVisibleImageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
setFrameStyles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
setPositions: React.Dispatch<React.SetStateAction<Record<string, {x: number, y: number}>>>;
placeholderImage: string;
}

export function useProfileImagesLoad({
setImages,
setVisibleImageIds,
setFrameStyles,
setPositions,
placeholderImage,
}: UseProfileImagesLoadProps) {

// 🆕 중복 로딩 방지를 위한 ref들
const loadCompleted = useRef(false);
const isLoading = useRef(false);

const loadProfileImages = async () => {
    // 🆕 이미 로딩 중이거나 완료되었으면 스킵
    if (isLoading.current || loadCompleted.current) {
      console.log('[useProfileImagesLoad] 이미 로딩 완료/진행 중, 스킵');
      return;
    }
    
    try {
      isLoading.current = true;
      console.log('[useProfileImagesLoad] 🚀 프로필 이미지 로드 시작');
      
      // 🆕 기존 전역 localStorage 키들 정리
      cleanupOldLocalStorage();
      
      const userId = await getCurrentUserId();
      if (!userId) {
        console.log('[useProfileImagesLoad] 로그인되지 않음, 빈 상태로 초기화');
        setImages([]);
        setVisibleImageIds(new Set());
        setFrameStyles({});
        setPositions({});
        return;
      }

      console.log('[useProfileImagesLoad] DB에서 클러스터 이미지 로드 중...');
      
      // 🆕 DB-first: 먼저 DB에서 클러스터 이미지들 가져오기
      const clusterImages = await getClusterImages(userId);
      
      if (clusterImages && clusterImages.length > 0) {
        console.log('[useProfileImagesLoad] DB에서 클러스터 이미지 로드 성공:', clusterImages.length);
        
        // DB 데이터를 ImageData 형식으로 변환
        const processedImages: ImageData[] = clusterImages.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          main_keyword: item.main_keyword || '',
          keywords: item.keywords || [],
          mood_keyword: item.mood_keyword || '',
          description: item.description || '',
          category: item.category || '',
          sizeWeight: item.size_weight || 1,
          src: item.src || placeholderImage,
          relatedVideos: item.related_videos || [],
          desired_self: item.desired_self || false,
          desired_self_profile: item.desired_self_profile,
          metadata: item.metadata || {},
          rotate: item.rotate || 0,
          width: item.width || 300,
          height: item.height || 200,
          left: item.left_position || '0px',
          top: item.top_position || '0px',
          position: { x: item.position_x || 0, y: item.position_y || 0 },
          frameStyle: item.frame_style || 'normal',
          created_at: item.created_at || new Date().toISOString()
        }));

        // 프레임 스타일과 위치 정보 추출
        const newFrameStyles: Record<string, string> = {};
        const newPositions: Record<string, {x: number, y: number}> = {};

        processedImages.forEach(img => {
          if (img.id) {
            const frameStyleFromDB = img.frameStyle || 'normal';
            newFrameStyles[img.id] = frameStyleFromDB;
            newPositions[img.id] = img.position || { x: 0, y: 0 };
            
            console.log(`[useProfileImagesLoad] 🎨 DB frameStyle 설정 - 이미지 ${img.id}: ${frameStyleFromDB}`);
          }
        });

        console.log('[useProfileImagesLoad] 🎨 최종 newFrameStyles:', newFrameStyles);

        // 🆕 상태 업데이트를 한 번에 처리 (중복 방지)
        console.log('[useProfileImagesLoad] 🔄 상태 업데이트 시작');
        setImages(processedImages);
        setVisibleImageIds(new Set(processedImages.map(img => img.id).filter(id => id) as string[]));
        setFrameStyles(newFrameStyles);
        setPositions(newPositions);

        // 🆕 DB 데이터를 사용자별 localStorage에 캐시 (기존 데이터 완전 교체)
        const storageKey = `profileImages_${userId}`;
        localStorage.removeItem(storageKey);
        localStorage.setItem(storageKey, JSON.stringify(processedImages));
        
        console.log('[useProfileImagesLoad] ✅ DB에서 ProfileImages 로드 완료:', processedImages.length);
        console.log('[useProfileImagesLoad] localStorage 캐시 교체 완료');
        
        loadCompleted.current = true;
        return;
      }

      // 🆕 DB가 비어있으면 localStorage도 정리하고 빈 상태로 초기화
      console.log('[useProfileImagesLoad] DB에 클러스터 이미지 없음, localStorage 정리 후 빈 상태로 초기화');
      
      // 사용자별 localStorage 키들 정리
      const userStorageKeys = [
        `profileImages_${userId}`,
        `moodboardHistories_${userId}`,
        `SliderHistory_${userId}`,
        `exploreWatchHistory_${userId}`,
        `watchHistory_${userId}`
      ];
      
      userStorageKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`[정리] 사용자별 키 삭제: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // 빈 상태로 초기화
      setImages([]);
      setVisibleImageIds(new Set());
      setFrameStyles({});
      setPositions({});
      
      console.log('[useProfileImagesLoad] ✅ DB 없음 + localStorage 정리 완료 - 빈 상태로 초기화');
      loadCompleted.current = true;

    } catch (error) {
      console.error('[useProfileImagesLoad] DB 로드 실패, 사용자별 localStorage fallback:', error);
      
      try {
        const userId = await getCurrentUserId();
        await loadFromLocalStorage(userId);
        loadCompleted.current = true;
      } catch (fallbackError) {
        console.error('[useProfileImagesLoad] localStorage fallback도 실패:', fallbackError);
        // 🔥 모든 로드 실패 시 빈 상태로 초기화
        setImages([]);
        setVisibleImageIds(new Set());
        setFrameStyles({});
        setPositions({});
        loadCompleted.current = true;
      }
    } finally {
      isLoading.current = false;
    }
  };

  const loadFromLocalStorage = async (userId?: string) => {
    if (!userId) return;
    
    const storageKey = `profileImages_${userId}`;
    const savedProfileImages = localStorage.getItem(storageKey);
    
    if (!savedProfileImages) {
      console.log('[useProfileImagesLoad] 사용자별 localStorage에 데이터 없음');
      return;
    }

    try {
      const parsedImagesData = JSON.parse(savedProfileImages);
      
      let imageArray: ImageData[];
      if (Array.isArray(parsedImagesData)) {
        imageArray = parsedImagesData;
      } else {
        imageArray = Object.values(parsedImagesData) as ImageData[];
      }
      
      const processedImages: ImageData[] = [];   
      const newFrameStyles: Record<string, string> = {};
      const newPositions: Record<string, {x: number, y: number}> = {};

      imageArray.forEach(img => {
        processedImages.push({
          ...img,
          id: img.id,
          src: img.src || placeholderImage,
          main_keyword: img.main_keyword || '',
          keywords: img.keywords || [],
          mood_keyword: img.mood_keyword || '',
          description: img.description || '',
          category: img.category || '',
          sizeWeight: img.sizeWeight || 0,
          relatedVideos: img.relatedVideos || [],
          desired_self: img.desired_self || false,
          desired_self_profile: img.desired_self_profile || null,
          metadata: img.metadata || {},
          rotate: img.rotate || 0,
          width: img.width || 0,
          height: img.height || 0,
          left: img.left || '0px',
          top: img.top || '0px',
          position: img.position || { x: Number(img.left?.replace('px', '') || 0), y: Number(img.top?.replace('px', '') || 0) },
          frameStyle: img.frameStyle || 'normal',
          user_id: img.user_id || '',
          created_at: img.created_at || new Date().toISOString(),
        });

        if (img.id && img.frameStyle) {
          newFrameStyles[img.id] = img.frameStyle;
          console.log(`[useProfileImagesLoad] 🎨 localStorage frameStyle 설정 - 이미지 ${img.id}: ${img.frameStyle}`);
        } else if (img.id) {
          newFrameStyles[img.id] = 'normal';
          console.log(`[useProfileImagesLoad] 🎨 localStorage frameStyle 기본값 설정 - 이미지 ${img.id}: normal`);
        }

        if (img.id) {
          if (img.position) {
            newPositions[img.id] = img.position;
          } else if (img.left !== undefined && img.top !== undefined) {
            newPositions[img.id] = {
              x: Number(img.left.replace('px', '')),
              y: Number(img.top.replace('px', '')),
            };
          } else {
            newPositions[img.id] = { x: 0, y: 0 }; 
          }
        }
      });
      
      // 🆕 상태 업데이트를 한 번에 처리 (중복 방지)
      console.log('[useProfileImagesLoad] 🎨 localStorage 최종 newFrameStyles:', newFrameStyles);
      setImages(processedImages);
      setVisibleImageIds(new Set(processedImages.map(img => img.id).filter(id => id) as string[]));
      setFrameStyles(newFrameStyles);
      setPositions(newPositions);
      
      console.log('[useProfileImagesLoad] ✅ 사용자별 localStorage에서 ProfileImages 로드됨:', processedImages.length);
    } catch (parseError) {
      console.error('[useProfileImagesLoad] localStorage 파싱 에러:', parseError);
    }
  };

  // 🆕 기존 전역 localStorage 키들 정리하는 cleanup 함수
  const cleanupOldLocalStorage = () => {
    const oldKeys = [
      'profileImages',
      'moodboardHistories', 
      'SliderHistory',
      'ProfileData',
      'profileData',
      'moodboard-bg-color' // 🆕 배경색도 정리
    ];
    
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`[Cleanup] 기존 전역 키 삭제: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('[Cleanup] 전역 localStorage 키 정리 완료');
  };

  useEffect(() => {
    // 🆕 컴포넌트 마운트 시 ref 초기화
    loadCompleted.current = false;
    isLoading.current = false;
    
    loadProfileImages();
    
    // 🆕 클린업: 컴포넌트 언마운트 시 ref 초기화
    return () => {
      loadCompleted.current = false;
      isLoading.current = false;
    };
  }, []); // strict dependency array - 마운트 시 1회만 실행
} 