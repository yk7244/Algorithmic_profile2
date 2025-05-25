import { useState } from "react";
import { useRouter } from "next/navigation";

export function useSearchMode(images: any[]) {
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [selectedImages, setSelectedImages] = useState<any[]>([]);
    const router = useRouter();

    const handleImageSelect = (image: any) => {
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

    return {
        isSearchMode,
        selectedImage,
        selectedImages,
        handleImageSelect,
        toggleSearchMode,
        handleSearch,
        setSelectedImage,
        setSelectedImages,
        setIsSearchMode,
    };
} 