import { useCallback } from "react";
import { 
  Position, 
  ImageData, 
  HistoryData 
} from '../../../types/profile';

export function useHistorySave({
  positions,
  frameStyles,
  images,
  histories,
  setHistories,
  setCurrentHistoryIndex,
  setIsEditing,
}: {
  positions: Record<string, Position>;
  frameStyles: Record<string, string>;
  images: ImageData[];
  histories: HistoryData[];
  setHistories: (h: HistoryData[]) => void;
  setCurrentHistoryIndex: (idx: number) => void;
  setIsEditing: (v: boolean) => void;
}) {
  return useCallback(() => {
    
    
    const newHistory = {
      timestamp: Date.now(),
      positions,
      frameStyles,
      images: images,
    };
    
    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories as HistoryData[]);
    //localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
    //setCurrentHistoryIndex(updatedHistories.length - 1);
    setIsEditing(false);
    
  }, [positions, frameStyles, images, histories, setHistories, setCurrentHistoryIndex, setIsEditing]);
} 