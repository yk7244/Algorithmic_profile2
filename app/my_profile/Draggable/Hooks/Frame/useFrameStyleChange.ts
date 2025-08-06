import { Dispatch, SetStateAction, useCallback } from "react";
import { ImageData } from "../../../../types/profile";
import { saveProfileImages } from "@/app/utils/save/saveImageData";
import { updateImageFrameStyle } from '@/lib/database-clean';

export function useFrameStyleChange(setFrameStyles: Dispatch<SetStateAction<Record<string, string>>>) {
  return useCallback(async (id: string, style: string) => {
    setFrameStyles(prev => {
      console.log(`🎨 프레임 스타일 변경 (useFrameStyleChange) - 이미지 ID: ${id}, 새 스타일: ${style}`);
      const newFrameStyles = {
        ...prev,
        [id]: style
      };
      console.log('업데이트된 frameStyles 상태:', newFrameStyles);
      return newFrameStyles;
    });

    // DB에서 이미지 프레임 스타일 업데이트 (localStorage 대체)
    try {
      const success = await updateImageFrameStyle(id, style);
      if (success) {
        console.log(`✅ DB에서 이미지 ${id}의 프레임 스타일 업데이트 완료: ${style}`);
        return; // DB 업데이트 성공 시 localStorage 업데이트 생략
      } else {
        console.error(`❌ DB에서 이미지 ${id}의 프레임 스타일 업데이트 실패`);
      }
    } catch (error) {
      console.error(`❌ DB 프레임 스타일 업데이트 오류:`, error);
    }

    // DB 업데이트 실패 시 localStorage 백업 업데이트
    console.warn('DB 업데이트 실패로 localStorage 백업 업데이트 수행');
    const profileImagesData = localStorage.getItem('profileImages');
    if (profileImagesData) {
      try {
        const profileImages = JSON.parse(profileImagesData);
        let updated = false;

        if (Array.isArray(profileImages)) {
            const updatedProfileImagesArray = profileImages.map((img: ImageData) => {
            if (img.id === id) {
              console.log(` localStorage (배열) - 이미지 ${id}의 frameStyle을 ${style}(으)로 업데이트합니다.`);
              updated = true;
              return { ...img, frameStyle: style };
            }
            return img;
          });
          if (updated) {
            saveProfileImages(updatedProfileImagesArray);
            console.log('✅ localStorage (배열) profileImages 업데이트 완료.');
          }
        } else {
          if (profileImages[id]) {
            console.log(` localStorage (객체) - 이미지 ${id}의 frameStyle을 ${style}(으)로 업데이트합니다.`);
            const updatedImage = { ...profileImages[id], frameStyle: style };
            const updatedProfileImagesObject = {
              ...profileImages,
              [id]: updatedImage
            };
            saveProfileImages(updatedProfileImagesObject);
            console.log('✅ localStorage (객체) profileImages 업데이트 완료.');
            updated = true;
          }
        }

        if (!updated) {
          console.log(`❌ localStorage profileImages에서 이미지 ID ${id}를 찾지 못했거나 이미 최신 상태입니다.`);
        }

      } catch (error) {
        console.error('localStorage profileImages 업데이트 중 에러:', error);
      }
    } else {
      console.log('❌ localStorage에 profileImages 데이터가 없습니다.');
    }
  }, [setFrameStyles]);
} 