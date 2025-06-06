import { useCallback } from "react";
import { 
  VideoData, 
  ImportedImageData, 
  MoodboardImageData, 
  Position, 
  HistoryData 
} from '../../../../types/profile';

type UseImageDeleteProps = {
    images: MoodboardImageData[];
    setImages: (imgs: MoodboardImageData[]) => void;
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    histories: HistoryData[];
    setHistories: (h: HistoryData[]) => void;
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
        
        const newHistory: HistoryData = {
            timestamp: Date.now(),
            positions,
            frameStyles,
            images: updatedImages
        };
        const updatedHistories = [...histories, newHistory];
        setHistories(updatedHistories);
        localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
        setCurrentHistoryIndex(updatedHistories.length - 1);
        setVisibleImageIds(new Set(updatedImages.map(img => img.id)));
        },
        [images, setImages, positions, frameStyles, histories, setHistories, setCurrentHistoryIndex, setVisibleImageIds]
    );
} 