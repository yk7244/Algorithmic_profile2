import { useEffect } from 'react';
import { ImageData } from '../../../types/profile';

interface UseProfileImagesLoadProps {
setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
setVisibleImageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
setFrameStyles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
setPositions: React.Dispatch<React.SetStateAction<Record<string, {x: number, y: number}>>>;
placeholderImage: string;
}

export function useProfileImagesLoad({
setImages,
setVisibleImageIds,
setFrameStyles,
setPositions,
placeholderImage,
}: UseProfileImagesLoadProps) {
const handleProfileImagesClick = () => {
    if (typeof window !== 'undefined') {
    const savedProfileImages = localStorage.getItem('profileImages');
    if (savedProfileImages) {
        const parsedImagesData = JSON.parse(savedProfileImages);
        
        let imageArray: ImageData[];
        if (Array.isArray(parsedImagesData)) {
        imageArray = parsedImagesData;
        } else {
        imageArray = Object.values(parsedImagesData) as ImageData[];
        }
        
        const processedImages: ImageData[] = [];   
        const newFrameStyles: Record<string, string> = {};
        const newPositions: Record<string, {x: number, y: number}> = {};

        imageArray.forEach(img => {
        processedImages.push({
            ...img,
            id: img.id,
            src: img.src || placeholderImage,
            main_keyword: img.main_keyword || '',
            keywords: img.keywords || [],
            mood_keyword: img.mood_keyword || '',
            description: img.description || '',
            category: img.category || '',
            sizeWeight: img.sizeWeight || 0,
            relatedVideos: img.relatedVideos || [],
            desired_self: img.desired_self || false,
            desired_self_profile: img.desired_self_profile || null,
            metadata: img.metadata || {},
            rotate: img.rotate || 0,
            width: img.width || 0,
            height: img.height || 0,
            left: img.left || '0px',
            top: img.top || '0px',
            position: img.position || { x: Number(img.left?.replace('px', '') || 0), y: Number(img.top?.replace('px', '') || 0) },
            frameStyle: img.frameStyle || 'normal',
            
            user_id: img.user_id || '',
            created_at: img.created_at || new Date().toISOString(),
        });

        if (img.id && img.frameStyle) {
            newFrameStyles[img.id] = img.frameStyle;
        } else if (img.id) {
            newFrameStyles[img.id] = 'normal';
        }

        if (img.id) {
            if (img.position) {
            newPositions[img.id] = img.position;
            } else if (img.left !== undefined && img.top !== undefined) {
            newPositions[img.id] = {
                x: Number(img.left.replace('px', '')),
                y: Number(img.top.replace('px', '')),
            };
            } else {
            newPositions[img.id] = { x: 0, y: 0 }; 
            }
        }
        });
        
        setImages(processedImages);
        setVisibleImageIds(new Set(processedImages.map(img => img.id).filter(id => id) as string[]));
        setFrameStyles(newFrameStyles);
        setPositions(newPositions);
        
        //console.log('[useProfileImagesLoad] ProfileImages 로드됨:', processedImages);
        //console.log('[useProfileImagesLoad] 로드된 FrameStyles:', newFrameStyles);
        //console.log('[useProfileImagesLoad] 로드된 Positions:', newPositions);
    }
    }
};

useEffect(() => {
    handleProfileImagesClick();
}, []); // placeholderImage는 초기 렌더링 시 고정값이므로 의존성 배열에 추가하지 않아도 될 수 있음
        // 또는, 안전하게 [placeholderImage, setImages, setVisibleImageIds, setFrameStyles, setPositions] 등을 포함할 수 있으나,
        // 이 경우 함수들이 useCallback으로 래핑되지 않았다면 매 렌더링마다 useEffect가 재실행될 수 있음.
        // 지금은 마운트 시 1회 실행을 의도하므로 비워둠.
} 