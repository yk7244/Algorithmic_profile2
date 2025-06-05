import { useState, useEffect, useCallback } from "react";
import { 
  Position, 
  MoodboardImageData, 
  HistoryData, 
  ImportedImageData
} from '../../../types/profile';

interface UseHistorySliderProps {
    images: MoodboardImageData[];
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    setPositions: (positions: Record<string, Position>) => void;
    setFrameStyles: (frameStyles: Record<string, string>) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
    setImages: (images: MoodboardImageData[]) => void;
    placeholderImage: string;
}

export function useHistorySlider({
    images: initialImages,
    positions: initialPositions,
    frameStyles: initialFrameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
    setImages,
    placeholderImage,
}: UseHistorySliderProps) {
    const [histories, setHistories] = useState<HistoryData[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    const loadAndSetProfileImages = useCallback(() => {
        console.log('🔵 [useHistorySlider] 원본 ProfileImages 상태로 전환 시도');
        const savedProfileImages = localStorage.getItem('profileImages');
        if (savedProfileImages) {
            try {
                const parsedImagesData = JSON.parse(savedProfileImages);
                let imageArray: ImportedImageData[];
                if (Array.isArray(parsedImagesData)) {
                    imageArray = parsedImagesData;
                } else {
                    imageArray = Object.values(parsedImagesData) as ImportedImageData[];
                }

                const processedImages: MoodboardImageData[] = [];
                const newFrameStyles: Record<string, string> = {};
                const newPositions: Record<string, Position> = {};

                imageArray.forEach(img => {
                    processedImages.push({
                        ...img,
                        src: img.src || placeholderImage,
                        main_keyword: img.main_keyword || '',
                        user_id: img.user_id || '',
                        position: img.position || { x: Number(img.left?.replace('px', '') || 0), y: Number(img.top?.replace('px', '') || 0) },
                        frameStyle: img.frameStyle || 'normal',
                        keywords: img.keywords || [],
                        sizeWeight: img.sizeWeight || 0,
                        relatedVideos: img.relatedVideos || [],
                        category: img.category || '',
                        mood_keyword: img.mood_keyword || '',
                        sub_keyword: img.sub_keyword || '',
                        description: img.description || '',
                        desired_self: img.desired_self || false,
                        desired_self_profile: img.desired_self_profile || null,
                        metadata: img.metadata || {},
                        rotate: img.rotate || 0,
                        width: img.width || 0,
                        height: img.height || 0,
                        alt: img.alt || '',
                        cluster: img.cluster || '',
                        color: img.color || 'gray',
                        left: img.left || '0px',
                        top: img.top || '0px',
                        created_at: img.created_at || new Date().toISOString(),
                    });

                    if (img.id) {
                        newFrameStyles[img.id] = img.frameStyle || 'normal';
                        if (img.position) {
                            newPositions[img.id] = img.position;
                        } else if (img.left !== undefined && img.top !== undefined) {
                            newPositions[img.id] = { x: Number(img.left.replace('px', '')), y: Number(img.top.replace('px', '')) };
                        } else {
                            newPositions[img.id] = { x: 0, y: 0 };
                        }
                    }
                });

                setImages(processedImages);
                setVisibleImageIds(new Set(processedImages.map(img => img.id).filter(Boolean) as string[]));
                setFrameStyles(newFrameStyles);
                setPositions(newPositions);
                console.log('✅ [useHistorySlider] ProfileImages 로드 및 상태 설정 완료');
            } catch (error) {
                console.error('[useHistorySlider] ProfileImages 파싱 또는 처리 중 에러:', error);
            }
        } else {
            console.log('❌ [useHistorySlider] localStorage에 ProfileImages가 없습니다');
        }
    }, [placeholderImage, setImages, setVisibleImageIds, setFrameStyles, setPositions]);

    useEffect(() => {
        const savedSliderHistories = localStorage.getItem('moodboardHistories');
        if (savedSliderHistories) {
            const parsed = JSON.parse(savedSliderHistories);
            setHistories(parsed);
            setCurrentHistoryIndex(-1);
        }
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined = undefined;
        if (isPlaying && histories.length > 0) {
            intervalId = setInterval(() => {
                setCurrentHistoryIndex(prev => {
                    const nextIndex = prev + 1;
                    if (nextIndex >= histories.length) {
                        setIsPlaying(false);
                        loadAndSetProfileImages();
                        return -1;
                    }
                    const selectedHistory = histories[nextIndex];
                    setImages(selectedHistory.images);
                    const positionsFromImages: Record<string, Position> = {};
                    const frameStylesFromImages: Record<string, string> = {};
                    selectedHistory.images.forEach((img: MoodboardImageData) => {
                        if (img.id) {
                            positionsFromImages[img.id] = img.position || { x: 0, y: 0 };
                            frameStylesFromImages[img.id] = img.frameStyle || 'normal';
                        }
                    });
                    setPositions(positionsFromImages);
                    setFrameStyles(frameStylesFromImages);
                    setVisibleImageIds(new Set(selectedHistory.images.map((img: MoodboardImageData) => img.id).filter(Boolean) as string[]));
                    return nextIndex;
                });
            }, 2000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, histories, loadAndSetProfileImages, setImages, setPositions, setFrameStyles, setVisibleImageIds]);

    const handleHistoryClick = useCallback((index: number) => {
        console.log(`[useHistorySlider] 히스토리 인덱스 ${index} 클릭`);
        setIsPlaying(false);
        if (index === -1) {
            loadAndSetProfileImages();
            setCurrentHistoryIndex(-1);
        } else if (histories[index]) {
            const selectedHistory = histories[index];
            setImages(selectedHistory.images);
            const positionsFromImages: Record<string, Position> = {};
            const frameStylesFromImages: Record<string, string> = {};
            selectedHistory.images.forEach((img: MoodboardImageData) => {
                if (img.id) {
                    positionsFromImages[img.id] = img.position || { x: 0, y: 0 };
                    frameStylesFromImages[img.id] = img.frameStyle || 'normal';
                }
            });
            setPositions(positionsFromImages);
            setFrameStyles(frameStylesFromImages);
            setVisibleImageIds(new Set(selectedHistory.images.map((img: MoodboardImageData) => img.id).filter(Boolean) as string[]));
            setCurrentHistoryIndex(index);
        }
    }, [histories, loadAndSetProfileImages, setImages, setPositions, setFrameStyles, setVisibleImageIds]);

    const handlePlayHistory = useCallback(() => {
        setIsPlaying(prev => !prev);
        if (!isPlaying && (currentHistoryIndex === -1 || currentHistoryIndex === histories.length - 1)) {
            if (histories.length > 0) {
                const firstHistory = histories[0];
                setImages(firstHistory.images);
                const positionsFromImages: Record<string, Position> = {};
                const frameStylesFromImages: Record<string, string> = {};
                firstHistory.images.forEach((img: MoodboardImageData) => {
                    if (img.id) {
                        positionsFromImages[img.id] = img.position || { x: 0, y: 0 };
                        frameStylesFromImages[img.id] = img.frameStyle || 'normal';
                    }
                });
                setPositions(positionsFromImages);
                setFrameStyles(frameStylesFromImages);
                setVisibleImageIds(new Set(firstHistory.images.map(img => img.id).filter(Boolean) as string[]));
                setCurrentHistoryIndex(0); 
            } else {
                setIsPlaying(false);
                return;
            }
        }
    }, [isPlaying, currentHistoryIndex, histories, setImages, setPositions, setFrameStyles, setVisibleImageIds]);

    return {
        histories,
        setHistories,
        currentHistoryIndex,
        setCurrentHistoryIndex,
        isPlaying,
        setIsPlaying,
        handleHistoryClick,
        handlePlayHistory,
    };
} 