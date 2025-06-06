import { useState, useEffect } from "react";
import { 
  Position, 
  MoodboardImageData, 
  HistoryData, 
  ImportedImageData
} from '../../../types/profile';

export function useHistorySlider({
    images,
    positions,
    frameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
    setImages,
    placeholderImage,
}: {
    images: MoodboardImageData[];
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    setPositions: (positions: Record<string, Position>) => void;
    setFrameStyles: (frameStyles: Record<string, string>) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
    setImages: (images: MoodboardImageData[]) => void;
    placeholderImage: string;
}) {
    const [histories, setHistories] = useState<HistoryData[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    // 히스토리 불러오기 (페이지 첫 로드 시)
    useEffect(() => {
        // 1. SliderHistory (검은 점들)를 불러옵니다.
        const savedHistoriesRaw = localStorage.getItem('SliderHistory');
        if (savedHistoriesRaw) {
            try {
                const parsedHistories = JSON.parse(savedHistoriesRaw);
                const migratedHistories = parsedHistories.map((history: any) => ({
                    ...history,
                    images: history.images || images // images는 props로 받은 초기 이미지
                }));
                setHistories(migratedHistories);
            } catch (e) {
                console.error("SliderHistory 파싱 에러:", e);
                setHistories([]);
            }
        }

        // 2. profileImages (파란 점)를 불러와 초기 뷰로 설정합니다.
        const profileImagesRaw = localStorage.getItem('profileImages');
        if (profileImagesRaw) {
            try {
                const profileImages = JSON.parse(profileImagesRaw);
                let imageArray: MoodboardImageData[] = [];
                if (Array.isArray(profileImages)) {
                    imageArray = profileImages;
                } else {
                    imageArray = Object.values(profileImages);
                }

                // 페이지가 처음 열릴 때, 슬라이더의 기본 상태는 profileImages
                setImages(imageArray);
                
                const positionsFromImages: Record<string, Position> = {};
                const frameStylesFromImages: Record<string, string> = {};

                imageArray.forEach((img: MoodboardImageData) => {
                    if (img.id && img.position) {
                        positionsFromImages[img.id] = img.position;
                    }
                    if (img.id) {
                        frameStylesFromImages[img.id] = img.frameStyle || 'healing';
                    }
                });
                
                setPositions(positionsFromImages);
                setFrameStyles(frameStylesFromImages);
                setVisibleImageIds(new Set<string>(imageArray.map((img) => img.id).filter(id => id)));
                setCurrentHistoryIndex(-1); // 파란 점을 활성화
            } catch (e) {
                console.error("profileImages 파싱 에러:", e);
                // 파싱 실패 시 아래의 fallback 로직을 타게 됨
            }
        } else if (savedHistoriesRaw) {
             // profileImages가 없으면, SliderHistory의 마지막 상태를 로드합니다.
            const histories = JSON.parse(savedHistoriesRaw);
            if (histories.length > 0) {
                const latestHistory = histories[histories.length - 1];
                setImages(latestHistory.images || []);
                const positionsFromImages: Record<string, Position> = {};
                (latestHistory.images || []).forEach((img: any) => {
                    if (img.id && img.position) positionsFromImages[img.id] = img.position;
                });
                setPositions(positionsFromImages);
                setFrameStyles(latestHistory.frameStyles || {});
                setCurrentHistoryIndex(histories.length - 1);
                setVisibleImageIds(new Set<string>((latestHistory.images || []).map((img: any) => img.id)));
            }
        } else {
            // 아무 히스토리도 없으면 props로 받은 초기 상태로 설정
            const initialHistory = {
                timestamp: Date.now(),
                positions: positions,
                frameStyles: frameStyles,
                images: images
            };
            setHistories([initialHistory]);
            setCurrentHistoryIndex(0);
            setVisibleImageIds(new Set<string>(images.map((img: any) => img.id)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                
                // 파란색 점 (profileImages) 상태 로드 및 설정
                const profileImagesData = localStorage.getItem('profileImages');
                if (profileImagesData) {
                    try {
                        const parsedProfileImages = JSON.parse(profileImagesData);
                        let imageArrayToProcess: ImportedImageData[];
                        if (Array.isArray(parsedProfileImages)) {
                            imageArrayToProcess = parsedProfileImages;
                        } else {
                            imageArrayToProcess = Object.values(parsedProfileImages) as ImportedImageData[];
                        }

                        const processedImagesForBlueDot: MoodboardImageData[] = [];
                        const newPositionsForBlueDot: Record<string, Position> = {};
                        const newFrameStylesForBlueDot: Record<string, string> = {};

                        imageArrayToProcess.forEach((img) => {
                            const moodboardImage: MoodboardImageData = {
                                ...img, // ImportedImageData의 모든 속성 복사
                                id: img.id || `fallback_id_${Math.random().toString(36).substr(2, 9)}`, // id는 필수, 없으면 임의 생성
                                src: img.src || placeholderImage,
                                main_keyword: img.main_keyword || '',
                                keywords: img.keywords || [],
                                sub_keyword: img.sub_keyword || '',
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
                            };
                            processedImagesForBlueDot.push(moodboardImage);

                            if (moodboardImage.id) {
                                newFrameStylesForBlueDot[moodboardImage.id] = moodboardImage.frameStyle;
                                newPositionsForBlueDot[moodboardImage.id] = moodboardImage.position;
                            }
                        });
                        
                        setImages(processedImagesForBlueDot);
                        setPositions(newPositionsForBlueDot);
                        setFrameStyles(newFrameStylesForBlueDot);
                        setVisibleImageIds(new Set<string>(processedImagesForBlueDot.map(pImg => pImg.id).filter(id => id)));
                        console.log('🔵 Playback: Switched to ProfileImages (blue dot) state');
                    } catch (error) {
                        console.error('🔵 Playback: Failed to load or process profileImages for blue dot:', error);
                    }
                } else {
                    console.warn('🔵 Playback: No profileImages found in localStorage for blue dot.');
                }
                return -1; // 파란색 점으로 인덱스 설정
            }
            // 기존 히스토리(검은색 점) 재생 로직
            const nextHistoryImageIds = new Set<string>(histories[nextIndex].images.map((img: any) => img.id));
            setVisibleImageIds(nextHistoryImageIds);
            setImages(histories[nextIndex].images);
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
    }, [isPlaying, histories, setPositions, setFrameStyles, setVisibleImageIds, setImages, placeholderImage]);

    // 히스토리 클릭 핸들러
    const handleHistoryClick = (index: number) => {
        console.log(`🕐 === 히스토리 ${index} 클릭 ===`);
        
        // -1은 원본 ProfileImages 상태를 의미
        if (index === -1) {
            //console.log('🔵 원본 ProfileImages 상태로 전환');
            setCurrentHistoryIndex(-1);
            
            const profileImagesData = localStorage.getItem('profileImages');
            
            if (profileImagesData) {
                try {
                    const profileImages = JSON.parse(profileImagesData);
                    //console.log('🖼️ ProfileImages 데이터 업데이트 중...');
                    
                    let imageArray: MoodboardImageData[] = [];
                    if (Array.isArray(profileImages)) {
                        imageArray = profileImages;
                    } else {
                        imageArray = Object.values(profileImages);
                    }
                    
                    setImages(imageArray);
                    
                    const positionsFromImages: Record<string, Position> = {};
                    const frameStylesFromImages: Record<string, string> = {}; // frameStyles 추출용 객체

                    imageArray.forEach((img: MoodboardImageData) => {
                        if (img.id && img.position) {
                            positionsFromImages[img.id] = img.position;
                        } else {
                            console.log(`❌ 이미지 ${img.id}에 position 없음`);
                        }
                        // 각 이미지의 frameStyle 값을 추출 (없으면 'healing' 기본값)
                        if (img.id) {
                            frameStylesFromImages[img.id] = img.frameStyle || 'healing'; 
                        }
                    });
                    
                    //console.log('📍 최종 positions:', positionsFromImages);
                    setPositions(positionsFromImages);

                    //console.log('🎨 최종 frameStyles:', frameStylesFromImages); // 추출된 frameStyles 로그
                    setFrameStyles(frameStylesFromImages); // 추출된 frameStyles로 상태 업데이트
                    console.log('🔵 ', imageArray);
                    const imageIds = imageArray.map((img: MoodboardImageData) => img.id).filter(id => id);
                    setVisibleImageIds(new Set<string>(imageIds));
                    
                    //console.log('✅ ProfileImages 로드 완료 (positions 및 frameStyles 포함)');
                } catch (error) {
                    console.error('ProfileImages 파싱 에러:', error);
                }
            } else {
                console.log('❌ ProfileImages가 localStorage에 없습니다');
            }
            
            return;
        }
        
        const selectedHistory = histories[index];
        //console.log('선택된 히스토리:', selectedHistory);
        //console.log('히스토리의 이미지 개수:', selectedHistory.images.length);
        
        const selectedHistoryImageIds = new Set<string>(selectedHistory.images.map((img: any) => img.id));
        //console.log('히스토리의 이미지 ID들:', Array.from(selectedHistoryImageIds));
        
        setVisibleImageIds(selectedHistoryImageIds);
        setCurrentHistoryIndex(index);
        
        // 해당 히스토리의 이미지 데이터로 업데이트 (position 포함)
       // console.log('🖼️ 이미지 데이터 업데이트 중...');
        setImages(selectedHistory.images);
        
        // 이미지 내부의 position에서 positions 객체 생성 (호환성을 위해)
        const positionsFromImages: Record<string, Position> = {};
        const frameStylesFromImages: Record<string, string> = {}; // frameStyles 추출용 객체
        selectedHistory.images.forEach((img: any) => {
            if (img.id) {
                frameStylesFromImages[img.id] = img.frameStyle || 'healing';
                //console.log('🎨 최종 frameStyles:', frameStylesFromImages); // 추출된 frameStyles 로그
            }
            if (img.id && img.position) {
                positionsFromImages[img.id] = img.position;
                //console.log(`📍 이미지 ${img.id} 위치:`, img.position);
            } else {
                console.log(`❌ 이미지 ${img.id}에 position 없음`);
            }
        });
        
        //console.log('📍 최종 positions:', positionsFromImages);
        setPositions(positionsFromImages);
        setFrameStyles(selectedHistory.frameStyles || {});
        //console.log('✅ 히스토리 로드 완료');
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