import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageData } from '../../../types/profile';

export function useSearchMode(images: ImageData[]) {   
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
    const router = useRouter();

    const handleImageSelect = (image: ImageData) => {
        setSelectedImage(image);
        const isAlreadySelected = selectedImages.some(img => img.id === image.id);
        if (isAlreadySelected) {
        setSelectedImages(prev => prev.filter(img => img.id !== image.id));
        } else {
        setSelectedImages(prev => [...prev, image]);
        }
    };

    const toggleSearchMode = () => {
        setIsSearchMode(prev => !prev);
        if (isSearchMode) {
        setSelectedImages([]);
        setSelectedImage(null);
        }
    };

    const handleSearch = () => {
        if (selectedImages.length === 0) return;
        const keywords = selectedImages.map(img => img.main_keyword).join(',');
        router.push(`/search?keywords=${encodeURIComponent(keywords)}`);
    };

    const setIsSearchModeWithReset = (value: boolean) => {
        setIsSearchMode(value);
        if (!value) {
            // 검색 모드 종료 시 선택 상태 초기화
            setSelectedImages([]);
            setSelectedImage(null);
        }
    };

    return {
        isSearchMode,
        selectedImage,
        selectedImages,
        handleImageSelect,
        toggleSearchMode,
        handleSearch,
        setSelectedImage,
        setSelectedImages,
        setIsSearchMode: setIsSearchModeWithReset,
    };
} 