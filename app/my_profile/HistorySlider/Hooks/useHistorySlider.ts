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
}: {
    images: MoodboardImageData[];
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    setPositions: (positions: Record<string, Position>) => void;
    setFrameStyles: (frameStyles: Record<string, string>) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
}) {
    const [histories, setHistories] = useState<HistoryData[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    // 히스토리 불러오기 및 마이그레이션
    useEffect(() => {
        const savedHistories = localStorage.getItem('SliderHistory');
        console.log('히스토리 불러오기 확인', savedHistories);
        if (savedHistories) {
        const parsedHistories = JSON.parse(savedHistories);
        const migratedHistories = parsedHistories.map((history: any) => ({
            ...history,
            images: history.images || images
        }));
        setHistories(migratedHistories);
        if (migratedHistories.length > 0) {
            const latestHistory = migratedHistories[migratedHistories.length - 1];
            setPositions(latestHistory.positions);
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
            setPositions(histories[nextIndex].positions);
            setFrameStyles(histories[nextIndex].frameStyles || {});
            return nextIndex;
            });
        }, 2000);
        }
        return () => {
        if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, histories, setPositions, setFrameStyles, setVisibleImageIds]);

    // 히스토리 클릭 핸들러
    const handleHistoryClick = (index: number) => {
        if (currentHistoryIndex === index) return;
        const selectedHistoryImageIds = new Set<string>(histories[index].images.map((img: any) => img.id));
        setVisibleImageIds(selectedHistoryImageIds);
        setCurrentHistoryIndex(index);
        setPositions(histories[index].positions);
        setFrameStyles(histories[index].frameStyles || {});
    };

    // 히스토리 재생 시작 핸들러
    const handlePlayHistory = () => {
        if (histories.length > 0) {
        const firstHistoryImageIds = new Set<string>(histories[0].images.map((img: any) => img.id));
        setVisibleImageIds(firstHistoryImageIds);
        setCurrentHistoryIndex(0);
        setPositions(histories[0].positions);
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