import { useCallback } from "react";

export function useImageChange(
    images: any[],
    setImages: (imgs: any[]) => void,
    positions: any,
    frameStyles: any,
    histories: any[],
    setHistories: (h: any[]) => void,
    setCurrentHistoryIndex: (idx: number) => void
    ) {
    return useCallback(
        (id: string, newSrc: string, newKeyword: string) => {
        // 이미지 배열 업데이트
        const updatedImages = images.map(img =>
            img.id === id ? { ...img, src: newSrc } : img
        );

        setImages(updatedImages);

        // localStorage의 profileImages도 업데이트
        const profileImagesData = localStorage.getItem('profileImages');
        if (profileImagesData) {
            const profileImages = JSON.parse(profileImagesData);
            const updatedProfileImages = {
            ...profileImages,
            [id]: {
                ...profileImages[id],
                src: newSrc
            }
            };
            localStorage.setItem('profileImages', JSON.stringify(updatedProfileImages));
        }

        // 새로운 히스토리 생성 및 저장
        const newHistory = {
            timestamp: Date.now(),
            positions,
            frameStyles,
            images: updatedImages
        };

        const updatedHistories = [...histories, newHistory];
        setHistories(updatedHistories);
        localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
        setCurrentHistoryIndex(updatedHistories.length - 1);
        },
        [images, setImages, positions, frameStyles, histories, setHistories, setCurrentHistoryIndex]
    );
} 