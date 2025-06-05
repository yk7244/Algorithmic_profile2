import { useState, useEffect } from "react";
import { 
  Position, 
  MoodboardImageData, 
  HistoryData 
} from '../../../types/profile';

export function useHistorySlider({
    images,
    positions,
    frameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
    setImages,
}: {
    images: MoodboardImageData[];
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    setPositions: (positions: Record<string, Position>) => void;
    setFrameStyles: (frameStyles: Record<string, string>) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
    setImages: (images: MoodboardImageData[]) => void;
}) {
    const [histories, setHistories] = useState<HistoryData[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    // 히스토리 불러오기 및 마이그레이션
    useEffect(() => {
        const savedHistories = localStorage.getItem('SliderHistory');
        //console.log('히스토리 불러오기 확인', savedHistories);
        if (savedHistories) {
        const parsedHistories = JSON.parse(savedHistories);
        const migratedHistories = parsedHistories.map((history: any) => ({
            ...history,
            images: history.images || images
        }));
        setHistories(migratedHistories);
        if (migratedHistories.length > 0) {
            const latestHistory = migratedHistories[migratedHistories.length - 1];
            
            // 이미지 내부의 position에서 positions 객체 생성
            const positionsFromImages: Record<string, Position> = {};
            latestHistory.images.forEach((img: any) => {
                if (img.id && img.position) {
                    positionsFromImages[img.id] = img.position;
                }
            });
            
            setPositions(positionsFromImages);
            setCurrentHistoryIndex(migratedHistories.length - 1);
            setFrameStyles(latestHistory.frameStyles || {});
            if (latestHistory.images && latestHistory.images.length > 0) {
            setVisibleImageIds(new Set<string>(latestHistory.images.map((img: any) => img.id)));
            }
        }
        localStorage.setItem('moodboardHistories', JSON.stringify(migratedHistories));
        } else {
        const initialHistory = {
            timestamp: Date.now(),
            positions: positions,
            frameStyles: frameStyles,
            images: images
        };
        setHistories([initialHistory]);
        localStorage.setItem('moodboardHistories', JSON.stringify([initialHistory]));
        setCurrentHistoryIndex(0);
        setVisibleImageIds(new Set<string>(images.map((img: any) => img.id)));
        }
        // eslint-disable-next-line
    }, []);

    // 히스토리 재생 효과
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isPlaying && histories.length > 0) {
        intervalId = setInterval(() => {
            setCurrentHistoryIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex >= histories.length) {
                setIsPlaying(false);
                return prev;
            }
            const nextHistoryImageIds = new Set<string>(histories[nextIndex].images.map((img: any) => img.id));
            setVisibleImageIds(nextHistoryImageIds);
            
            // 해당 히스토리의 이미지 데이터로 업데이트 (position 포함)
            setImages(histories[nextIndex].images);
            
            // 이미지 내부의 position에서 positions 객체 생성 (호환성을 위해)
            const positionsFromImages: Record<string, Position> = {};
            histories[nextIndex].images.forEach((img: any) => {
                if (img.id && img.position) {
                    positionsFromImages[img.id] = img.position;
                }
            });
            
            setPositions(positionsFromImages);
            setFrameStyles(histories[nextIndex].frameStyles || {});
            return nextIndex;
            });
        }, 2000);
        }
        return () => {
        if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, histories, setPositions, setFrameStyles, setVisibleImageIds, setImages]);

    // 히스토리 클릭 핸들러
    const handleHistoryClick = (index: number) => {
        console.log(`🕐 === 히스토리 ${index} 클릭 ===`);
        
        // -1은 원본 ProfileImages 상태를 의미
        if (index === -1) {
            console.log('🔵 원본 ProfileImages 상태로 전환');
            setCurrentHistoryIndex(-1);
            // ProfileImages는 handleProfileImagesClick에서 처리되므로 
            // 여기서는 히스토리 관련 상태만 리셋
            
            const profileImagesData = localStorage.getItem('profileImages');
            
            if (profileImagesData) {
                try {
                    const profileImages = JSON.parse(profileImagesData);
                    
                    // 해당 히스토리의 이미지 데이터로 업데이트 (position 포함)
                    console.log('🖼️ ProfileImages 데이터 업데이트 중...');
                    
                    // 배열인지 객체인지 확인해서 처리
                    let imageArray: any[] = [];
                    if (Array.isArray(profileImages)) {
                        imageArray = profileImages;
                    } else {
                        // 객체인 경우 Object.values()로 배열로 변환
                        imageArray = Object.values(profileImages);
                    }
                    
                    setImages(imageArray);
                    
                    // 이미지 내부의 position에서 positions 객체 생성 (호환성을 위해)
                    const positionsFromImages: Record<string, Position> = {};
                    imageArray.forEach((img: any) => {
                        if (img.id && img.position) {
                            positionsFromImages[img.id] = img.position;
                            console.log(`📍 이미지 ${img.id} 위치:`, img.position);
                        } else {
                            console.log(`❌ 이미지 ${img.id}에 position 없음`);
                        }
                    });
                    
                    console.log('📍 최종 positions:', positionsFromImages);
                    setPositions(positionsFromImages);
                    
                    // visibleImageIds 설정
                    const imageIds = imageArray.map((img: any) => img.id).filter(id => id);
                    setVisibleImageIds(new Set<string>(imageIds));
                    
                    console.log('✅ ProfileImages 로드 완료');
                } catch (error) {
                    console.error('ProfileImages 파싱 에러:', error);
                }
            } else {
                console.log('❌ ProfileImages가 localStorage에 없습니다');
            }
            
            return;
        }
        
        const selectedHistory = histories[index];
        console.log('선택된 히스토리:', selectedHistory);
        console.log('히스토리의 이미지 개수:', selectedHistory.images.length);
        
        const selectedHistoryImageIds = new Set<string>(selectedHistory.images.map((img: any) => img.id));
        console.log('히스토리의 이미지 ID들:', Array.from(selectedHistoryImageIds));
        
        setVisibleImageIds(selectedHistoryImageIds);
        setCurrentHistoryIndex(index);
        
        // 해당 히스토리의 이미지 데이터로 업데이트 (position 포함)
        console.log('🖼️ 이미지 데이터 업데이트 중...');
        setImages(selectedHistory.images);
        
        // 이미지 내부의 position에서 positions 객체 생성 (호환성을 위해)
        const positionsFromImages: Record<string, Position> = {};
        selectedHistory.images.forEach((img: any) => {
            if (img.id && img.position) {
                positionsFromImages[img.id] = img.position;
                console.log(`📍 이미지 ${img.id} 위치:`, img.position);
            } else {
                console.log(`❌ 이미지 ${img.id}에 position 없음`);
            }
        });
        
        console.log('📍 최종 positions:', positionsFromImages);
        setPositions(positionsFromImages);
        setFrameStyles(selectedHistory.frameStyles || {});
        console.log('✅ 히스토리 로드 완료');
    };

    // 히스토리 재생 시작 핸들러
    const handlePlayHistory = () => {
        if (histories.length > 0) {
        const firstHistoryImageIds = new Set<string>(histories[0].images.map((img: any) => img.id));
        setVisibleImageIds(firstHistoryImageIds);
        setCurrentHistoryIndex(0);
        
        // 첫 번째 히스토리의 이미지 데이터로 업데이트 (position 포함)
        setImages(histories[0].images);
        
        // 이미지 내부의 position에서 positions 객체 생성 (호환성을 위해)
        const positionsFromImages: Record<string, Position> = {};
        histories[0].images.forEach((img: any) => {
            if (img.id && img.position) {
                positionsFromImages[img.id] = img.position;
            }
        });
        
        setPositions(positionsFromImages);
        setFrameStyles(histories[0].frameStyles || {});
        setIsPlaying(true);
        }
    };

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