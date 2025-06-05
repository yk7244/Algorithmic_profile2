import { useCallback } from "react";
import { 
  VideoData, 
  ImportedImageData, 
  MoodboardImageData, 
  Position, 
  HistoryData 
} from '../../../types/profile';

type UseImageDeleteProps = {
    images: MoodboardImageData[];
    setImages: (imgs: MoodboardImageData[]) => void;
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    histories: HistoryData[];
    setHistories: (h: HistoryData[]) => void;
    setCurrentHistoryIndex: (i: number) => void;
    setVisibleImageIds: (ids: Set<string>) => void;
};

export function useImageDelete({
    images,
    setImages,
    positions,
    frameStyles,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setVisibleImageIds,
    }: UseImageDeleteProps) {
    return useCallback(
        (id: string) => {
        const updatedImages = images.filter(img => img.id !== id);
        setImages(updatedImages);
        const newHistory: HistoryData = {
            timestamp: Date.now(),
            positions,
            frameStyles,
            images: updatedImages
        };
        const updatedHistories = [...histories, newHistory];
        setHistories(updatedHistories);
        localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
        setCurrentHistoryIndex(updatedHistories.length - 1);
        setVisibleImageIds(new Set(updatedImages.map(img => img.id)));
        },
        [images, setImages, positions, frameStyles, histories, setHistories, setCurrentHistoryIndex, setVisibleImageIds]
    );
} 