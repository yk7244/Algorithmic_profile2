import { useCallback } from "react";
import { DragEndEvent } from '@dnd-kit/core';
import { ImageData } from '../../../../types/profile';
import { Dispatch, SetStateAction } from 'react';
import { saveProfileImages } from "@/app/utils/save/saveImageData";
import { getActiveUserImages, saveActiveUserImages, updateImagePosition } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

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
          
          // DB에 이미지 위치 즉시 업데이트 (localStorage 대체)
          updateImagePositionInDB(imageId, newPosition).catch(console.error);
          
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
  }, [isEditing, images, setImages, setPositions]);
}

// DB에 이미지 위치 업데이트하는 헬퍼 함수 (단일 이미지만)
async function updateImagePositionInDB(imageId: string, position: {x: number, y: number}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log(`🔄 DB에 이미지 위치 업데이트: ${imageId}`, position);
    
    // ✅ 단일 이미지 위치만 업데이트 (전체 재생성 없음)
    const success = await updateImagePosition(imageId, position.x, position.y);
    
    if (success) {
      console.log('✅ 이미지 위치 DB 업데이트 완료:', imageId);
    } else {
      console.warn('⚠️ 이미지 위치 DB 업데이트 실패');
    }
    
  } catch (error) {
    console.error('❌ 이미지 위치 DB 업데이트 중 오류:', error);
  }
} 