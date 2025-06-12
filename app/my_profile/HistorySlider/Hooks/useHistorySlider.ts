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

                // 🆕 DB-first: 먼저 DB에서 슬라이더 히스토리 로드 시도 ('self' 버전만)
                try {
                    const dbSliderHistory = await getSliderHistory(userId, 'self');
                    if (dbSliderHistory && dbSliderHistory.length > 0) {
                        // DB 데이터를 HistoryData 형식으로 변환
                        const formattedHistories = dbSliderHistory.map((item: any) => ({
                            timestamp: new Date(item.created_at).getTime(),
                            positions: {},  // SliderHistory에는 positions가 없으므로 images에서 추출
                            frameStyles: {}, // 마찬가지로 images에서 추출
                            images: item.images || []
                        }));

                        setHistories(formattedHistories);
                        console.log('[useHistorySlider] DB에서 자체 저장 슬라이더 히스토리 로드 완료:', formattedHistories.length);
                        
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
        setIsTransitioning(true);
        
        // 1단계: 기존 이미지들의 위치를 먼저 업데이트 (부드러운 이동)
        const newPositions: Record<string, {x: number, y: number}> = {};
        const newFrameStyles: Record<string, string> = {};
        
        targetHistory.images.forEach((img: any) => {
            if (img.id && img.position) {
                newPositions[img.id] = img.position;
                newFrameStyles[img.id] = img.frameStyle || 'normal';
            }
        });
        
        // 위치와 프레임 스타일을 먼저 업데이트 (기존 이미지들이 부드럽게 이동)
        setPositions(newPositions);
        setFrameStyles(newFrameStyles);
        
        // 2단계: 300ms 대기 후 이미지 데이터 업데이트 (새로운 이미지 추가/제거)
        setTimeout(() => {
            const targetImageIds = new Set<string>(targetHistory.images.map((img: any) => img.id).filter(id => id));
            setVisibleImageIds(targetImageIds);
            setImages(targetHistory.images);
            setCurrentHistoryIndex(targetIndex);
            
            // 3단계: 추가 300ms 대기 후 전환 완료
            setTimeout(() => {
                setIsTransitioning(false);
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