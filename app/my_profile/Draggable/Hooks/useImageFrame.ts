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
        case 'cloud':
            // 클라우드 모양 근사치 (SVG path를 polygon으로 변환)
            return 'polygon(20% 60%, 15% 45%, 20% 25%, 40% 28%, 45% 10%, 65% 10%, 70% 25%, 90% 25%, 90% 50%, 85% 60%, 95% 65%, 90% 85%, 70% 80%, 65% 90%, 45% 90%, 40% 80%, 20% 85%, 10% 70%, 20% 60%)';
        case 'heart':
            // 하트 모양 근사치 (SVG path를 polygon으로 변환)
            return 'polygon(50% 90%, 20% 70%, 0% 40%, 20% 20%, 30% 10%, 50% 20%, 50% 35%, 50% 20%, 70% 10%, 80% 20%, 100% 40%, 80% 70%, 50% 90%)';
       case 'pentagon':
            return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
        case 'star':
            // 새로운 별 모양 (SVG path를 polygon으로 변환)
            return 'polygon(12.5% 39.6%, 27.9% 60.2%, 22.4% 85%, 50% 78.1%, 75.8% 85.7%, 72.2% 60.4%, 85.2% 38.3%, 62.5% 34.4%, 50% 15.6%, 37.2% 33.9%)';
        case 'pill':
            // pill(알약) 모양 ellipse clip-path
            return 'ellipse(50% 50% at 50% 50%)';
        case 'wavy-star':
            // wavy-star(물결/톱니 별) 모양 근사치
            return 'polygon(15.6% 28.1%, 9.4% 31.3%, 12.5% 37.5%, 9.4% 43.8%, 12.5% 46.9%, 9.4% 53.1%, 12.5% 59.4%, 9.4% 62.5%, 12.5% 65.6%, 9.4% 71.9%, 12.5% 75%, 18.8% 71.9%, 25% 75%, 31.3% 71.9%, 37.5% 75%, 43.8% 71.9%, 50% 75%, 56.3% 71.9%, 62.5% 75%, 68.8% 71.9%, 75% 75%, 81.3% 71.9%, 84.4% 75%, 90.6% 71.9%, 87.5% 65.6%, 90.6% 59.4%, 87.5% 53.1%, 90.6% 46.9%, 87.5% 40.6%, 90.6% 37.5%, 87.5% 31.3%, 87.5% 25%, 81.3% 21.9%, 75% 25%, 68.8% 21.9%, 62.5% 25%, 56.3% 21.9%, 50% 25%, 43.8% 21.9%, 37.5% 25%, 31.3% 21.9%, 25% 25%, 18.8% 21.9%)';
        default:
            return '';
        }
    };

    // 프레임 스타일에 따라 Tailwind 클래스 반환
    const getFrameStyle = () => {
        if (image.desired_self) return '';
        switch (frameStyle) {
        case 'healing':
            return '';
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