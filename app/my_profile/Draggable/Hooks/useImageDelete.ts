import { useCallback } from "react";

// page.tsx에서 사용되는 타입을 직접 정의 (중복 방지 위해 실제 타입 정의부와 맞춰서 복사)

type VideoData = {
    title: string;
    embedId: string;
};

interface ImportedImageData {
    id: string;
    src: string;
    main_keyword: string;
    width: number;
    height: number;
    rotate: number;
    left: string;
    top: string;
    keywords: string[];
    sizeWeight: number;
    relatedVideos: VideoData[];
    category: string;
    mood_keyword: string;
    sub_keyword: string;
    description: string;
    desired_self: boolean;
    desired_self_profile: string | null;
    color?: string;
}

type ImageData = Required<ImportedImageData>;

type Position = {
    x: number;
    y: number;
};

type HistoryData = {
    timestamp: number;
    positions: Record<string, Position>;
    frameStyles: Record<string, string>;
    images: ImageData[];
};

type UseImageDeleteProps = {
    images: ImageData[];
    setImages: (imgs: ImageData[]) => void;
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