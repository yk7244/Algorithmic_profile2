import { useCallback } from "react";
import { DragEndEvent } from '@dnd-kit/core';
import { ImageData } from '../../../../types/profile';
import { Dispatch, SetStateAction } from 'react';
import { updateClusterImages, getCurrentUserId, ensureUserExists } from '@/lib/database';

export function useDragEnd(
  isEditing: boolean, 
  images: ImageData[], 
  setImages: (imgs: ImageData[] | ((prev: ImageData[]) => ImageData[])) => void,
  setPositions: Dispatch<SetStateAction<Record<string, {x: number, y: number}>>>
) {
  return useCallback((event: DragEndEvent) => {
    if (!isEditing) return;
    
    const { active, delta } = event;
    
    // active 또는 active.id가 없으면 리턴
    if (!active || !active.id) {
      console.warn('Drag event missing active or active.id');
      return;
    }
    
    const imageId = active.id.toString();
    console.log(`🔄 드래그 종료 - 이미지 ID: ${imageId}, 델타:`, delta);
    
    setImages((prevImages: ImageData[]) => {
      return prevImages.map((image: ImageData) => {
        if (image.id === imageId) { 
          const currentPosition = image.position;
          console.log(`📍 현재 위치 (image.position):`, currentPosition);
          console.log('✅ 객체 형태 profileImages 즉시 업데이트 전 (${imageId}):', currentPosition);
          
          const newPosition = {
            x: currentPosition.x + delta.x,
            y: currentPosition.y + delta.y,
          };
          
          console.log(`📍 새로운 위치:`, newPosition);
          console.log(`📍 CSS 속성: left=${newPosition.x}px, top=${newPosition.y}px`);
          
          // positions 상태도 함께 업데이트
          setPositions(prevPositions => {
            const updatedPositions = {
              ...prevPositions,
              [imageId]: newPosition
            };
            console.log(`📍 업데이트된 positions 상태:`, updatedPositions);
            return updatedPositions;
          });
          
          // 🆕 사용자별 profileImages localStorage 즉시 업데이트
          const updateLocalStorageWithUserKey = async () => {
            try {
              const userId = await getCurrentUserId();
              const profileImagesKey = userId ? `profileImages_${userId}` : 'profileImages';
              
              const profileImagesData = localStorage.getItem(profileImagesKey);
          if (profileImagesData) {
              const profileImages = JSON.parse(profileImagesData);
                console.log('🔄 드래그 시 사용자별 profileImages 즉시 업데이트 시작');
              
              if (Array.isArray(profileImages)) {
                // 배열인 경우
                const updatedProfileImages = profileImages.map((img: any) => {
                  if (img.id === imageId) {
                    return {
                      ...img,
                      left: `${newPosition.x}px`,
                      top: `${newPosition.y}px`,
                      position: newPosition,
                    };
                  }
                  return img;
                });
                  localStorage.setItem(profileImagesKey, JSON.stringify(updatedProfileImages));
                  console.log(`✅ 배열 형태 사용자별 profileImages 즉시 업데이트 완료 (${imageId}):`, newPosition);
              } else {
                // 객체인 경우
                if (profileImages[imageId]) {
                  const updatedProfileImages = {
                    ...profileImages,
                    [imageId]: {
                      ...profileImages[imageId],
                      left: `${newPosition.x}px`,
                      top: `${newPosition.y}px`,
                      position: newPosition,
                    }
                  };
                  
                    localStorage.setItem(profileImagesKey, JSON.stringify(updatedProfileImages));
                    console.log(`✅ 객체 형태 사용자별 profileImages 즉시 업데이트 완료 (${imageId}):`, newPosition);
                } else {
                    console.log(`❌ 사용자별 profileImages에서 ${imageId} 키를 찾을 수 없음`);
                  }
                }
              }
            } catch (error) {
              console.error('사용자별 profileImages 업데이트 중 에러:', error);
            }
          };
          
          updateLocalStorageWithUserKey();
          
          // 🆕 DB에도 위치 업데이트 (비동기, 실패해도 UI는 정상 작동)
          updateImagePositionInDB(imageId, newPosition);
          
          return {
            ...image,
            position: newPosition,
            left: `${newPosition.x}px`,
            top: `${newPosition.y}px`,
          };
        }
        return image;
      });
    });

    // 🆕 DB 업데이트 헬퍼 함수
    const updateImagePositionInDB = async (imageId: string, newPosition: {x: number, y: number}) => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('[드래그] 로그인되지 않음, DB 업데이트 스킵');
          return;
        }

        // 🆕 사용자별 localStorage에서 전체 profileImages 데이터 가져와서 DB에 업데이트
        const profileImagesKey = `profileImages_${userId}`;
        const profileImagesData = localStorage.getItem(profileImagesKey);
        if (profileImagesData) {
          const profileImages = JSON.parse(profileImagesData);
          
          // ImageData 형식으로 변환
          let imageDataArray: ImageData[] = [];
          if (Array.isArray(profileImages)) {
            imageDataArray = profileImages.map((item: any) => ({
              ...item,
              user_id: userId,
              relatedVideos: item.relatedVideos || []
            }));
          } else {
            imageDataArray = Object.values(profileImages).map((item: any) => ({
              ...item,
              user_id: userId,
              relatedVideos: item.relatedVideos || []
            }));
          }

          // cluster_images 테이블 전체 업데이트
          await updateClusterImages(userId, imageDataArray);
          console.log(`✅ [드래그] cluster_images DB 업데이트 완료 (${imageId})`);
        }
      } catch (error) {
        console.error('[드래그] DB 업데이트 실패 (계속 진행):', error);
        // DB 업데이트 실패해도 UI는 정상 작동하도록 함
      }
    };
  }, [isEditing, images, setImages, setPositions]);
} 