import { useCallback } from "react";
import { DragEndEvent } from '@dnd-kit/core';
import { ImageData } from '../../../../types/profile';
import { Dispatch, SetStateAction } from 'react';
import { saveProfileImages } from "@/app/utils/saveImageData";

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
          
          // profileImages localStorage 즉시 업데이트
          const profileImagesData = localStorage.getItem('profileImages');
          if (profileImagesData) {
            try {
              const profileImages = JSON.parse(profileImagesData);
              console.log('🔄 드래그 시 profileImages 즉시 업데이트 시작');
              
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
                saveProfileImages(updatedProfileImages);
                console.log(`✅ 배열 형태 profileImages 즉시 업데이트 완료 (${imageId}):`, newPosition);
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
                  
                  saveProfileImages(updatedProfileImages);
                  console.log(`✅ 객체 형태 profileImages 즉시 업데이트 완료 (${imageId}):`, newPosition);
                  const check =  localStorage.getItem('profileImages');
                  console.log('check', check);
                } else {
                  console.log(`❌ profileImages에서 ${imageId} 키를 찾을 수 없음`);
                }
              }
            } catch (error) {
              console.error('profileImages 업데이트 중 에러:', error);
            }
          }
          
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