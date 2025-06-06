import { useState, useEffect } from "react";

export function useImageSearch(image: any, showImageModal: boolean, onImageChange: (id: string, src: string, keyword: string) => void, setShowImageModal: (v: boolean) => void) {
    const [alternativeImages, setAlternativeImages] = useState<any[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    const fetchAlternativeImages = async () => {
        setIsLoadingImages(true);
        try {
        const searchKeywords = [image.main_keyword, ...image.keywords].slice(0, 2).join(' ');
        const response = await fetch('/api/search-image?' + new URLSearchParams({
            query: searchKeywords
        }));
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`이미지 검색 실패 (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const shuffledResults = data.items
            .sort(() => Math.random() - 0.5)
            .slice(0, 4)
            .map((item: any) => ({
                id: item.link,
                urls: { regular: item.link },
                alt_description: item.title.replace(/<\/?b>/g, '')
            }));
            setAlternativeImages(shuffledResults);
        } else {
            setAlternativeImages([]);
        }
        } catch (error) {
        setAlternativeImages([]);
        } finally {
        setIsLoadingImages(false);
        }
    };

    useEffect(() => {
        if (showImageModal) {
        fetchAlternativeImages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showImageModal]);

    const handleImageSelect = async (selectedImage: any) => {
        try {
        const newSrc = selectedImage.urls.regular;
        const newKeyword = selectedImage.alt_description || image.main_keyword;
        onImageChange(image.id, newSrc, newKeyword);
        setShowImageModal(false);
        } catch (error) {
        // 에러 핸들링 필요시 추가
        }
    };

    return {
        alternativeImages,
        isLoadingImages,
        fetchAlternativeImages,
        handleImageSelect,
        setAlternativeImages,
    };
} 