import { useCallback } from "react";

export function useHistorySave({
  positions,
  frameStyles,
  images,
  histories,
  setHistories,
  setCurrentHistoryIndex,
  setIsEditing,
}: {
  positions: any;
  frameStyles: any;
  images: any[];
  histories: any[];
  setHistories: (h: any[]) => void;
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