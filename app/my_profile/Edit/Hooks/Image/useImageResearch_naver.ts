import { useState, useEffect, useCallback } from "react";

export function useImageSearch(image: any, showImageModal: boolean, onImageChange: (id: string, src: string, keyword: string) => void, setShowImageModal: (v: boolean) => void) {
    const [alternativeImages, setAlternativeImages] = useState<any[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchAlternativeImages = async (page = 1, isLoadMore = false) => {
        if (isLoadMore) {
            setIsLoadingMore(true);
        } else {
            setIsLoadingImages(true);
            setCurrentPage(1);
            setHasMore(true);
        }
        
        try {
            const searchKeywords = [image.main_keyword, ...image.keywords].slice(0, 2).join(' ');
            const response = await fetch('/api/search-image?' + new URLSearchParams({
                query: searchKeywords,
                start: ((page - 1) * 8 + 1).toString() // 네이버 API의 start 파라미터
            }));
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`이미지 검색 실패 (${response.status}): ${errorText}`);
            }
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const newResults = data.items
                    .slice(0, 8)
                    .map((item: any) => ({
                        id: item.link + '_' + page, // 페이지별로 고유 ID 생성
                        urls: { regular: item.link },
                        alt_description: item.title.replace(/<\/?b>/g, '')
                    }));
                
                if (isLoadMore) {
                    setAlternativeImages(prev => {
                        const combined = [...prev, ...newResults];
                        // 최대 20개까지만 유지
                        return combined.slice(0, 20);
                    });
                } else {
                    setAlternativeImages(newResults);
                }
                
                // 8개 미만이면 더 이상 로드할 데이터가 없음 또는 20개에 도달했으면 중단
                if (data.items.length < 8) {
                    setHasMore(false);
                }
                
                setCurrentPage(page);
                
                // 20개에 도달했으면 더 이상 로드하지 않음
                setAlternativeImages(prev => {
                    if (prev.length >= 20) {
                        setHasMore(false);
                    }
                    return prev;
                });
            } else {
                if (!isLoadMore) {
                    setAlternativeImages([]);
                }
                setHasMore(false);
            }
        } catch (error) {
            if (!isLoadMore) {
                setAlternativeImages([]);
            }
            setHasMore(false);
        } finally {
            setIsLoadingImages(false);
            setIsLoadingMore(false);
        }
    };

    const loadMoreImages = useCallback(() => {
        if (!isLoadingMore && hasMore && alternativeImages.length < 20) {
            fetchAlternativeImages(currentPage + 1, true);
        }
    }, [currentPage, isLoadingMore, hasMore, alternativeImages.length, image.main_keyword, image.keywords]);

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
        isLoadingMore,
        hasMore,
        fetchAlternativeImages,
        loadMoreImages,
        handleImageSelect,
        setAlternativeImages,
    };
} 