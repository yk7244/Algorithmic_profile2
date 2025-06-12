import { Dispatch, SetStateAction, useCallback } from "react";
import { ImageData } from "../../../../types/profile";
import { updateClusterImages, getClusterImages, getCurrentUserId } from '@/lib/database';

export function useFrameStyleChange(
  setFrameStyles: Dispatch<SetStateAction<Record<string, string>>>,
  setImages?: Dispatch<SetStateAction<ImageData[]>>
) {
  return useCallback(async (id: string, style: string) => {
    // 1. frameStyles state 업데이트
    setFrameStyles(prev => {
      console.log(`🎨 frameStyles 상태 변경 (useFrameStyleChange) - 이미지 ID: ${id}, 새 스타일: ${style}`);
      const newFrameStyles = {
        ...prev,
        [id]: style
      };
      console.log('업데이트된 frameStyles 상태:', newFrameStyles);
      return newFrameStyles;
    });

    // 2. 🆕 images 배열의 frameStyle도 업데이트
    if (setImages) {
      setImages(prev => {
        const updatedImages = prev.map(img => 
          img.id === id ? { ...img, frameStyle: style } : img
        );
        console.log(`🖼️ images 배열 frameStyle 업데이트 - 이미지 ID: ${id}, 새 스타일: ${style}`);
        return updatedImages;
      });
    }

    // 🆕 cluster_images DB 즉시 반영 (현재 프로필 최신 상태 유지)
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // DB에서 현재 클러스터 이미지들 가져오기
        const currentClusterImages = await getClusterImages(userId);
        
        if (currentClusterImages && currentClusterImages.length > 0) {
          // DB 데이터를 ImageData 형식으로 변환하고 프레임 스타일 업데이트
          const updatedImages: Omit<ImageData, 'id'>[] = currentClusterImages.map((item: any) => {
            const isTargetImage = item.id === id;
            
            return {
              user_id: item.user_id,
              main_keyword: item.main_keyword,
              keywords: item.keywords || [],
              mood_keyword: item.mood_keyword || '',
              description: item.description || '',
              category: item.category || '',
              sizeWeight: item.size_weight || 1,
              src: item.src,
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
              frameStyle: isTargetImage ? style : (item.frame_style || 'normal'), // 🎯 타겟 이미지만 프레임 스타일 변경
              created_at: item.created_at || new Date().toISOString()
            };
          });

          // cluster_images DB에 즉시 업데이트 (현재 프로필 최신 상태 유지)
          await updateClusterImages(userId, updatedImages);
          console.log(`✅ cluster_images DB 즉시 반영 완료 - 이미지 ID: ${id}, 새 스타일: ${style}`);
        }
      }
    } catch (error) {
      console.error('🚨 cluster_images DB 즉시 반영 실패:', error);
    }

    // 🆕 사용자별 localStorage 업데이트 (캐시 목적)
    try {
      const userId = await getCurrentUserId();
      const storageKey = userId ? `profileImages_${userId}` : 'profileImages';
      
      const profileImagesData = localStorage.getItem(storageKey);
      if (profileImagesData) {
        const profileImages = JSON.parse(profileImagesData);
        let updated = false;

        if (Array.isArray(profileImages)) {
          const updatedProfileImagesArray = profileImages.map((img: ImageData) => {
            if (img.id === id) {
              console.log(`📝 사용자별 localStorage (배열) - 이미지 ${id}의 frameStyle을 ${style}(으)로 업데이트합니다.`);
              updated = true;
              return { ...img, frameStyle: style };
            }
            return img;
          });
          if (updated) {
            localStorage.setItem(storageKey, JSON.stringify(updatedProfileImagesArray));
            console.log('✅ 사용자별 localStorage (배열) profileImages 업데이트 완료.');
          }
        } else {
          if (profileImages[id]) {
            console.log(`📝 사용자별 localStorage (객체) - 이미지 ${id}의 frameStyle을 ${style}(으)로 업데이트합니다.`);
            const updatedImage = { ...profileImages[id], frameStyle: style };
            const updatedProfileImagesObject = {
              ...profileImages,
              [id]: updatedImage
            };
            localStorage.setItem(storageKey, JSON.stringify(updatedProfileImagesObject));
            console.log('✅ 사용자별 localStorage (객체) profileImages 업데이트 완료.');
            updated = true;
          }
        }

        if (!updated) {
          console.log(`❌ 사용자별 localStorage profileImages에서 이미지 ID ${id}를 찾지 못했거나 이미 최신 상태입니다.`);
        }
      } else {
        console.log('❌ 사용자별 localStorage에 profileImages 데이터가 없습니다.');
      }
    } catch (localError) {
      console.error('사용자별 localStorage 프레임 스타일 저장 실패:', localError);
    }
  }, [setFrameStyles, setImages]);
} 