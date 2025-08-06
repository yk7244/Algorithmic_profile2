import { useCallback } from "react";
import { 
  ImageData, 
  HistoryData 
} from '../../../types/profile';

import { saveSliderHistory } from '@/app/utils/save/saveSliderHistory';

export function useHistorySave({
  positions,
  frameStyles,
  images,
  histories,
  setHistories,
  setCurrentHistoryIndex,
  setIsEditing,
}: {
  positions: Record<string, {x: number, y: number}>;
  frameStyles: Record<string, string>;
  images: ImageData[];
  histories: HistoryData[];
  setHistories: (h: HistoryData[]) => void;
  setCurrentHistoryIndex: (idx: number) => void;
  setIsEditing: (v: boolean) => void;
}) {
  return useCallback(async () => {
    
    
    const newHistory = {
      timestamp: Date.now(),
      positions,
      frameStyles,
      images: images,
    };
    
    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories as HistoryData[]);
    
    // DB에 슬라이더 히스토리 저장 (localStorage 대체)
    try {
      await saveSliderHistory('self'); // 편집 완료 시 'self' 타입으로 저장
      console.log('✅ 슬라이더 히스토리 DB 저장 완료');
    } catch (error) {
      console.error('❌ 슬라이더 히스토리 DB 저장 오류:', error);
      
      // 오류 시 localStorage 백업
      localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
    }
    
    setCurrentHistoryIndex(updatedHistories.length - 1);
    setIsEditing(false);
    
  }, [positions, frameStyles, images, histories, setHistories, setCurrentHistoryIndex, setIsEditing]);
} 