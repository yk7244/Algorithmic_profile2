import { useCallback } from "react";
import { ImageData } from '../../../../types/profile';

type UseImageDeleteProps = {
    images: ImageData[];
    setImages: (imgs: ImageData[]) => void;
    positions: Record<string, ImageData['position']>;
    frameStyles: Record<string, string>;
    histories: any[];
    setHistories: (h: any[]) => void;
    setCurrentHistoryIndex: (i: number) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
};

export function useImageDelete({
    images,
    setImages,
    positions,
    frameStyles,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setVisibleImageIds,
    }: UseImageDeleteProps) {
    return useCallback(
        (id: string) => {
        const updatedImages = images.filter(img => img.id !== id);
        setImages(updatedImages);
        
        // profileImages에서도 삭제
        const profileImagesData = localStorage.getItem('profileImages');
        if (profileImagesData) {
            try {
                const profileImages = JSON.parse(profileImagesData);
                let updatedProfileImages;
                
                if (Array.isArray(profileImages)) {
                    // 배열인 경우
                    updatedProfileImages = profileImages.filter((img: any) => img.id !== id);
                } else {
                    // 객체인 경우
                    updatedProfileImages = { ...profileImages };
                    delete updatedProfileImages[id];
                }
                
                localStorage.setItem('profileImages', JSON.stringify(updatedProfileImages));
                console.log(`✅ profileImages에서 이미지 ${id} 삭제 완료`);
            } catch (error) {
                console.error('profileImages 삭제 중 오류:', error);
            }
        }
        
        // 삭제 후 현재 보이는 이미지 ID 업데이트
        setVisibleImageIds(new Set(updatedImages.map(img => img.id)));
        },
        [images, setImages, setVisibleImageIds]
    );
} 