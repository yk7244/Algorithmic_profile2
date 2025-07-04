import { useCallback } from "react";
import { ImageData } from '../../../../types/profile';
import { saveProfileImages } from "@/app/utils/saveImageData";

export function useImageChange(
    images: ImageData[],
    setImages: (imgs: ImageData[]) => void,
    positions: Record<string, ImageData['position']>,
    frameStyles: Record<string, string>,
    histories: any[],
    setHistories: (h: any[]) => void,
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
            img.id === id ? { ...img, src: newSrc } : img
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
                        return { ...img, src: newSrc};
                    }
                    return img;
                });
                saveProfileImages(updatedProfileImages);
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
                            
                        }
                    };
                    saveProfileImages(updatedProfileImages);
                    console.log('✅ 객체 형태 profileImages 업데이트 완료');
                } else {
                    console.log(`❌ 객체에서 이미지 ${id}를 찾을 수 없음`);
                }
            }
        } else {
            console.log('❌ profileImages가 localStorage에 없습니다');
        }

        
        },
        [images, setImages, positions, frameStyles, histories, setHistories, setCurrentHistoryIndex]
    );
} 