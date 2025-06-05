import { useCallback } from "react";
import { 
  Position, 
  MoodboardImageData, 
  HistoryData 
} from '../../../types/profile';

export function useImageChange(
    images: MoodboardImageData[],
    setImages: (imgs: MoodboardImageData[]) => void,
    positions: Record<string, Position>,
    frameStyles: Record<string, string>,
    histories: HistoryData[],
    setHistories: (h: HistoryData[]) => void,
    setCurrentHistoryIndex: (idx: number) => void
    ) {
    return useCallback(
        (id: string, newSrc: string, newKeyword: string) => {
        console.log('🖼️ === 이미지 변경 시작 ===');
        console.log(`이미지 ID: ${id}`);
        console.log(`새로운 src: ${newSrc}`);
        console.log(`새로운 keyword: ${newKeyword}`);
        
        // 이미지 배열 업데이트
        const updatedImages = images.map(img =>
            img.id === id ? { ...img, src: newSrc, main_keyword: newKeyword } : img
        );

        setImages(updatedImages);
        console.log('✅ images 배열 업데이트 완료');

        // localStorage의 profileImages도 업데이트
        const profileImagesData = localStorage.getItem('profileImages');
        console.log('📦 현재 profileImages 데이터:', profileImagesData ? '존재' : '없음');
        
        if (profileImagesData) {
            const profileImages = JSON.parse(profileImagesData);
            console.log('📦 profileImages 타입:', Array.isArray(profileImages) ? '배열' : '객체');
            
            // 배열인지 객체인지 확인해서 처리
            if (Array.isArray(profileImages)) {
                // 배열인 경우
                console.log('📦 배열 처리 시작');
                const updatedProfileImages = profileImages.map((img: any) => {
                    if (img.id === id) {
                        console.log(`✅ 배열에서 이미지 ${id} 찾음, 업데이트 중...`);
                        return { ...img, src: newSrc, main_keyword: newKeyword };
                    }
                    return img;
                });
                localStorage.setItem('profileImages', JSON.stringify(updatedProfileImages));
                console.log('✅ 배열 형태 profileImages 업데이트 완료');
            } else {
                // 객체인 경우
                console.log('📦 객체 처리 시작');
                if (profileImages[id]) {
                    console.log(`✅ 객체에서 이미지 ${id} 찾음, 업데이트 중...`);
                    const updatedProfileImages = {
                        ...profileImages,
                        [id]: {
                            ...profileImages[id],
                            src: newSrc,
                            main_keyword: newKeyword
                        }
                    };
                    localStorage.setItem('profileImages', JSON.stringify(updatedProfileImages));
                    console.log('✅ 객체 형태 profileImages 업데이트 완료');
                } else {
                    console.log(`❌ 객체에서 이미지 ${id}를 찾을 수 없음`);
                }
            }
        } else {
            console.log('❌ profileImages가 localStorage에 없습니다');
        }

        // 새로운 히스토리 생성 및 저장
        const newHistory = {
            timestamp: Date.now(),
            positions,
            frameStyles,
            images: updatedImages
        };

        const updatedHistories = [...histories, newHistory];
        setHistories(updatedHistories);
        localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
        setCurrentHistoryIndex(updatedHistories.length - 1);
        
        console.log('✅ 이미지 변경 및 히스토리 저장 완료');
        },
        [images, setImages, positions, frameStyles, histories, setHistories, setCurrentHistoryIndex]
    );
} 