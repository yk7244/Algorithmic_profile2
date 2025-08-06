import { useCallback } from "react";
import { ImageData } from '../../../../types/profile';
import { deleteImage } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

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
        
        // DB에서도 이미지 삭제 (localStorage 대체)
        deleteImageFromDB(id).catch(console.error);
        
        // localStorage 백업에서도 삭제 (하위 호환성)
        const profileImagesData = localStorage.getItem('profileImages');
        if (profileImagesData) {
            try {
                const profileImages = JSON.parse(profileImagesData);
                let updatedProfileImages;
                
                if (Array.isArray(profileImages)) {
                    updatedProfileImages = profileImages.filter((img: any) => img.id !== id);
                } else {
                    updatedProfileImages = { ...profileImages };
                    delete updatedProfileImages[id];
                }
                
                localStorage.setItem('profileImages', JSON.stringify(updatedProfileImages));
                console.log(`✅ localStorage 백업에서 이미지 ${id} 삭제 완료`);
            } catch (error) {
                console.error('localStorage 백업 삭제 중 오류:', error);
            }
        }
        
        // 삭제 후 현재 보이는 이미지 ID 업데이트
        setVisibleImageIds(new Set(updatedImages.map(img => img.id)));
        },
        [images, setImages, setVisibleImageIds]
    );
}

// DB에서 이미지 삭제하는 헬퍼 함수
async function deleteImageFromDB(imageId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log(`🗑️ DB에서 이미지 삭제: ${imageId}`);
    
    // TODO: DB에서 실제 이미지 삭제 구현
    // const success = await deleteImage(imageId);
    // if (success) {
    //   console.log(`✅ DB에서 이미지 ${imageId} 삭제 완료`);
    // }
    
  } catch (error) {
    console.error('이미지 DB 삭제 중 에러:', error);
  }
} 