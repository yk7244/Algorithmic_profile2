import { useState } from "react";

export function useImageFrame(frameStyleProp: string, image: any, onFrameStyleChange: (id: string, style: string) => void) {
    const [frameStyle, setFrameStyle] = useState(frameStyleProp);

    // 프레임 스타일에 따라 클립패스 반환
    const getClipPath = () => {
        if (image.desired_self) {
        return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        }
        switch (frameStyle) {
        case 'inspiration':
            return 'polygon(50% 0%, 61% 20%, 75% 20%, 80% 35%, 95% 40%, 90% 55%, 100% 65%, 90% 75%, 85% 90%, 70% 85%, 50% 100%, 30% 85%, 15% 90%, 10% 75%, 0% 65%, 10% 55%, 5% 40%, 20% 35%, 25% 20%, 39% 20%)';
        case 'interest':
            return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        default:
            return '';
        }
    };

    // 프레임 스타일에 따라 Tailwind 클래스 반환
    const getFrameStyle = () => {
        if (image.desired_self) return '';
        switch (frameStyle) {
        case 'healing':
            return 'rounded-lg';
        case 'inspiration':
            return '';
        case 'people':
            return 'rounded-full';
        case 'interest':
            return '';
        default:
            return '';
        }
    };

    // 프레임 스타일 변경 핸들러
    const handleFrameStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFrameStyle(e.target.value);
        onFrameStyleChange(image.id, e.target.value);
    };

    return {
        frameStyle,
        setFrameStyle,
        getClipPath,
        getFrameStyle,
        handleFrameStyleChange,
    };
} 