import { useCallback } from "react";
import { 
  Position, 
  MoodboardImageData, 
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
  images: MoodboardImageData[];
  histories: HistoryData[];
  setHistories: (h: HistoryData[]) => void;
  setCurrentHistoryIndex: (idx: number) => void;
  setIsEditing: (v: boolean) => void;
}) {
  return useCallback(() => {
    const updatedImages = images.map(image => {
      const pos = positions[image.id];
      return {
        ...image,
        left: pos ? `${pos.x}px` : image.left,
        top: pos ? `${pos.y}px` : image.top,
      };
    });
    const newHistory = {
      timestamp: Date.now(),
      positions,
      frameStyles,
      images: updatedImages,
    };
    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories);
    localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
    setCurrentHistoryIndex(updatedHistories.length - 1);
    setIsEditing(false);
  }, [positions, frameStyles, images, histories, setHistories, setCurrentHistoryIndex, setIsEditing]);
} 