import { useCallback } from "react";
import { ImageData } from '../../../../types/profile';
import { updateClusterImages, getCurrentUserId, ensureUserExists } from '@/lib/database';

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
        
        // 🆕 사용자별 profileImages에서도 삭제
        const deleteFromUserStorage = async () => {
            try {
                const userId = await getCurrentUserId();
                const profileImagesKey = userId ? `profileImages_${userId}` : 'profileImages';
                
                const profileImagesData = localStorage.getItem(profileImagesKey);
                if (profileImagesData) {
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
                
                    localStorage.setItem(profileImagesKey, JSON.stringify(updatedProfileImages));
                    console.log(`✅ 사용자별 profileImages에서 이미지 ${id} 삭제 완료`);
                }
            } catch (error) {
                console.error('사용자별 profileImages 삭제 중 오류:', error);
            }
        };
        
        deleteFromUserStorage();
        
        // 🆕 DB에서도 삭제 (비동기, 실패해도 UI는 정상 작동)
        deleteImageFromDB(updatedImages);
        
        // 삭제 후 현재 보이는 이미지 ID 업데이트
        setVisibleImageIds(new Set(updatedImages.map(img => img.id)));
        },
        [images, setImages, setVisibleImageIds]
    );

    // 🆕 DB 업데이트 헬퍼 함수
    const deleteImageFromDB = async (updatedImages: ImageData[]) => {
        try {
            const userId = await getCurrentUserId();
            if (!userId) {
                console.log('[이미지삭제] 로그인되지 않음, DB 업데이트 스킵');
                return;
            }

            // 사용자 존재 확인
            await ensureUserExists();

            // cluster_images 테이블 전체 업데이트 (삭제된 이미지 제외하고 재저장)
            await updateClusterImages(userId, updatedImages);
            console.log('[이미지삭제] cluster_images DB 업데이트 완료');
        } catch (error) {
            console.error('[이미지삭제] DB 업데이트 실패 (계속 진행):', error);
            // DB 업데이트 실패해도 UI는 정상 작동하도록 함
        }
    };
} 