import { useState, useEffect } from "react";
import { 
  HistoryData, 
  ImageData
} from '../../../types/profile';
import { getSliderHistory, getCurrentUserId, ensureUserExists } from '@/lib/database';

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
    images: ImageData[];   
    positions: Record<string, {x: number, y: number}>;
    frameStyles: Record<string, string>;
    setPositions: (positions: Record<string, {x: number, y: number}>) => void;
    setFrameStyles: (frameStyles: Record<string, string>) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
    setImages: (images: ImageData[]) => void;
    placeholderImage: string;
}) {
    const [histories, setHistories] = useState<HistoryData[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false); // 🆕 전환 애니메이션 상태

    // 히스토리 불러오기 (페이지 첫 로드 시)
    useEffect(() => {
        const loadHistoriesWithUserKeys = async () => {
            try {
                const userId = await getCurrentUserId();
                if (!userId) {
                    console.log('[useHistorySlider] 로그인되지 않음, 빈 상태로 초기화');
                setHistories([]);
                    setCurrentHistoryIndex(-1);
                    return;
        }

                // 🆕 사용자별 localStorage 키 사용
                const userSliderHistoryKey = `SliderHistory_${userId}`;

                // 🆕 DB-first: 먼저 DB에서 슬라이더 히스토리 로드 시도 (모든 타입)
                try {
                    console.log(`[useHistorySlider] DB에서 사용자 ${userId}의 슬라이더 히스토리 로드 시도...`);
                    const dbSliderHistory = await getSliderHistory(userId); // 모든 타입 가져오기
                    
                    console.log(`[useHistorySlider] DB 로드 결과:`, {
                        'userId': userId,
                        'dbSliderHistory': dbSliderHistory,
                        '개수': dbSliderHistory?.length || 0
                    });
                    
                    if (dbSliderHistory && dbSliderHistory.length > 0) {
                        // DB 데이터를 HistoryData 형식으로 변환
                        const formattedHistories = dbSliderHistory.map((item: any, index: number) => {
                            const images = item.images || [];
                            
                            console.log(`[useHistorySlider] 히스토리 [${index}] 변환:`, {
                                'id': item.id,
                                'version_type': item.version_type,
                                'created_at': item.created_at,
                                'nickname': item.nickname,
                                'images_count': images.length,
                                'images_sample': images.slice(0, 2)
                            });
                            
                            // 이미지가 없는 히스토리는 경고 로그 출력
                            if (images.length === 0) {
                                console.warn(`⚠️ 히스토리 ID ${item.id}에 이미지가 없습니다 (${new Date(item.created_at).toLocaleString()})`);
                            }
                            
                            // 🆕 이미지 ID 유효성 검사 및 수정
                            const validatedImages = images.map((img: any, imgIndex: number) => {
                                if (!img.id) {
                                    console.warn(`⚠️ 히스토리 ${item.id}의 이미지 [${imgIndex}]에 ID가 없습니다. 생성합니다.`);
                                    img.id = `${item.id}_img_${imgIndex}_${Date.now()}`;
                                }
                                return img;
                            });
                            
                            return {
                                timestamp: new Date(item.created_at).getTime(),
                                positions: {},  // SliderHistory에는 positions가 없으므로 images에서 추출
                                frameStyles: {}, // 마찬가지로 images에서 추출
                                images: validatedImages,
                                version_type: item.version_type // 🆕 타입 정보 보존
                            };
                        });

                        // 🆕 시간순 정렬 (오래된 것부터)
                        formattedHistories.sort((a, b) => a.timestamp - b.timestamp);

                        setHistories(formattedHistories);
                        console.log('[useHistorySlider] DB에서 모든 슬라이더 히스토리 로드 완료:', {
                            '총 개수': formattedHistories.length,
                            'upload 타입': formattedHistories.filter(h => h.version_type === 'upload').length,
                            'self 타입': formattedHistories.filter(h => h.version_type === 'self').length,
                            '별모양 히스토리': formattedHistories.filter(h => 
                                h.images && h.images.some((img: any) => img.desired_self === true)
                            ).length
                        });
                        
                        // 사용자별 캐시용 localStorage에 저장
                        localStorage.setItem(userSliderHistoryKey, JSON.stringify(formattedHistories));
                        setCurrentHistoryIndex(-1); // 파란 점을 활성화
                        return;
                    }
                } catch (dbError) {
                    console.error('[useHistorySlider] DB 로드 실패:', dbError);
                }

                // Fallback: 사용자별 SliderHistory (검은 점들)를 localStorage에서 불러옵니다.
                const savedHistoriesRaw = localStorage.getItem(userSliderHistoryKey);
                if (savedHistoriesRaw) {
                    try {
                        const parsedHistories = JSON.parse(savedHistoriesRaw);
                        // 🆕 이미지 로딩을 완전히 제거하고 기존 히스토리만 로드
                        setHistories(parsedHistories);
                        console.log('[useHistorySlider] 사용자별 localStorage에서 SliderHistory 로드됨:', parsedHistories.length);
                    } catch (e) {
                        console.error("사용자별 SliderHistory 파싱 에러:", e);
                        setHistories([]);
                    }
                }

                // 🆕 이미지 로딩 완전 제거 - useProfileImagesLoad에만 의존
                console.log('[useHistorySlider] ✅ 이미지 로딩은 useProfileImagesLoad에 완전 위임');
                setCurrentHistoryIndex(-1); // 파란 점을 활성화

            } catch (error) {
                console.error('[useHistorySlider] 사용자별 키 로드 실패:', error);
                setHistories([]);
                setCurrentHistoryIndex(-1);
            }
        };

        loadHistoriesWithUserKeys();
    }, []); // 마운트 시 1회 실행

    // 🆕 부드러운 히스토리 전환 함수
    const smoothTransitionToHistory = async (targetHistory: HistoryData, targetIndex: number) => {
        console.log(`🔄 [smoothTransitionToHistory] 히스토리 ${targetIndex}로 전환 시작`);
        console.log('전환할 히스토리 데이터:', {
            timestamp: new Date(targetHistory.timestamp).toLocaleString(),
            images_count: targetHistory.images?.length || 0,
            images: targetHistory.images
        });
        
        setIsTransitioning(true);
        
        // 1단계: 기존 이미지들의 위치를 먼저 업데이트 (부드러운 이동)
        const newPositions: Record<string, {x: number, y: number}> = {};
        const newFrameStyles: Record<string, string> = {};
        
        if (targetHistory.images && targetHistory.images.length > 0) {
            targetHistory.images.forEach((img: any) => {
                if (img.id && img.position) {
                    newPositions[img.id] = img.position;
                    newFrameStyles[img.id] = img.frameStyle || 'normal';
                }
            });
            
            console.log('새로운 positions:', newPositions);
            console.log('새로운 frameStyles:', newFrameStyles);
        } else {
            console.warn('⚠️ 히스토리에 이미지가 없습니다!');
        }
        
        // 위치와 프레임 스타일을 먼저 업데이트 (기존 이미지들이 부드럽게 이동)
        setPositions(newPositions);
        setFrameStyles(newFrameStyles);
        
        // 2단계: 300ms 대기 후 이미지 데이터 업데이트 (새로운 이미지 추가/제거)
        setTimeout(() => {
            if (targetHistory.images && targetHistory.images.length > 0) {
                const targetImageIds = new Set<string>(targetHistory.images.map((img: any) => img.id).filter(id => id));
                console.log('설정할 visible 이미지 IDs:', Array.from(targetImageIds));
                
                setVisibleImageIds(targetImageIds);
                setImages(targetHistory.images);
                setCurrentHistoryIndex(targetIndex);
                
                console.log('✅ 이미지 데이터 업데이트 완료');
            } else {
                console.warn('⚠️ 히스토리에 표시할 이미지가 없습니다');
                setVisibleImageIds(new Set());
                setImages([]);
                setCurrentHistoryIndex(targetIndex);
            }
            
            // 3단계: 추가 300ms 대기 후 전환 완료
            setTimeout(() => {
                setIsTransitioning(false);
                console.log('✅ 히스토리 전환 완료');
            }, 300);
        }, 400);
    };

    // 🆕 부드러운 현재 상태로 복귀 함수  
    const smoothTransitionToCurrent = async () => {
        setIsTransitioning(true);
        
        // 현재 props의 이미지 위치와 스타일 적용
        const currentPositions: Record<string, {x: number, y: number}> = {};
        const currentFrameStyles: Record<string, string> = {};
        
        images.forEach((img: any) => {
            if (img.id) {
                currentPositions[img.id] = positions[img.id] || img.position || { x: 0, y: 0 };
                currentFrameStyles[img.id] = frameStyles[img.id] || img.frameStyle || 'normal';
            }
        });
        
        setPositions(currentPositions);
        setFrameStyles(currentFrameStyles);
        
        setTimeout(() => {
            const currentImageIds = images.map(img => img.id).filter(id => id) as string[];
            setVisibleImageIds(new Set<string>(currentImageIds));
            setCurrentHistoryIndex(-1);
            
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }, 400);
    };

    // 히스토리 재생 효과
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isPlaying && histories.length > 0) {
        intervalId = setInterval(() => {
            setCurrentHistoryIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex >= histories.length) {
                setIsPlaying(false);
                // 🆕 부드러운 전환으로 현재 상태로 복귀
                smoothTransitionToCurrent();
                return -1;
                            }
            // 🆕 부드러운 전환으로 다음 히스토리로 이동
            smoothTransitionToHistory(histories[nextIndex], nextIndex);
            return nextIndex;
            });
        }, 2000); // 🆕 전환 시간을 고려하여 2초로 조정
        }
        return () => {
        if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, histories]);  // 🆕 함수 의존성 제거

    // 히스토리 클릭 핸들러
    const handleHistoryClick = async (index: number) => {
        console.log(`🕐 === 히스토리 ${index} 클릭 ===`);
        
        // 전환 중이면 무시
        if (isTransitioning) return;
        
        // -1은 원본 ProfileImages 상태를 의미
        if (index === -1) {
            console.log('🔵 원본 ProfileImages 상태로 전환 (부드러운 전환)');
            await smoothTransitionToCurrent();
            return;
        }
        
        const selectedHistory = histories[index];
        console.log('⚫ 히스토리로 전환 (부드러운 전환):', index);
        await smoothTransitionToHistory(selectedHistory, index);
    };

    // 히스토리 재생 시작 핸들러
    const handlePlayHistory = async () => {
        if (histories.length > 0 && !isTransitioning) {
            console.log('▶️ 히스토리 재생 시작 (부드러운 전환)');
            await smoothTransitionToHistory(histories[0], 0);
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
        smoothTransitionToHistory,
        smoothTransitionToCurrent,
        isTransitioning, // �� 전환 상태도 반환
    };
} 