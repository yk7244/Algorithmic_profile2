import { useState, useEffect } from "react";

export function useImageFrame(frameStyleProp: string, image: any, onFrameStyleChange: (id: string, style: string) => void) {
    const [frameStyle, setFrameStyle] = useState(frameStyleProp);

    // frameStyleProp이 변경될 때마다 내부 frameStyle 상태를 업데이트
    useEffect(() => {
        console.log(`[useImageFrame] 프레임 스타일 업데이트 - ID: ${image.id}, ${frameStyle} → ${frameStyleProp}`);
        if (frameStyleProp !== frameStyle) {
            setFrameStyle(frameStyleProp);
        }
    }, [frameStyleProp, image.id]); // frameStyle 의존성 제거로 무한 루프 방지

    // 🆕 프레임 스타일에 따라 클립패스 반환 (frameOptions와 일치)
    const getClipPath = () => {
        switch (frameStyle) {
        case 'normal':
            // 기본 사각형 (클립패스 없음)
            return '';
        case 'people':
            // 원형 (CSS로 처리)
            return '';
        case 'heart':
            // 하트 모양
            return 'polygon(38.79% 85.85%, 25% 75%, 12.5% 55%, 12.5% 35%, 17.5% 15%, 30% 8%, 42.5% 15%, 50% 25%, 57.5% 15%, 70% 8%, 82.5% 15%, 87.5% 35%, 87.5% 55%, 75% 75%, 61.21% 85.85%, 50% 95%)';
        case 'pill':
            // 알약 모양 (CSS로 처리)
            return '';
        case 'cokie':
            // 쿠키(지그재그) 모양
            return 'polygon(11.79% 16.32%, 5% 21.41%, 8.39% 31.5%, 5% 41.68%, 8.39% 46.77%, 5% 56.86%, 8.39% 66.95%, 5% 72.04%, 8.39% 77.13%, 5% 87.22%, 8.39% 92.31%, 18.48% 87.22%, 28.57% 92.31%, 35.84% 87.22%, 45.93% 92.31%, 53.2% 87.22%, 61.37% 92.31%, 68.64% 87.22%, 76.81% 92.31%, 84.08% 87.22%, 91.35% 92.31%, 95% 87.22%, 98.39% 92.31%, 95% 82.13%, 98.39% 72.04%, 95% 61.95%, 98.39% 51.86%, 95% 41.77%, 98.39% 36.68%, 95% 26.59%, 100% 16.5%, 91.83% 11.41%, 84.56% 16.5%, 78.19% 11.41%, 71.82% 16.5%, 65.45% 11.41%, 59.08% 16.5%, 52.71% 11.41%, 46.34% 16.5%, 39.97% 11.41%, 33.6% 16.5%, 27.23% 11.41%, 18.16% 21.59%)';
        default: 
            return '';
        }
    };

    // 🆕 프레임 스타일에 따라 Tailwind 클래스 반환 (frameOptions와 일치)
    const getFrameStyle = () => {
        switch (frameStyle) {
        case 'normal':
            // 기본 사각형
            return 'rounded-none';
        case 'people':
            // 원형
            return 'rounded-full';
        case 'heart':
            // 하트 모양 (클립패스 사용)
            return '';
        case 'pill':
            // 알약 모양
            return 'rounded-full';
        case 'cokie':
            // 쿠키 모양 (클립패스 사용)
            return '';
        default:
            return 'rounded-none';
        }
    };

    // 프레임 스타일 변경 핸들러
    const handleFrameStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStyle = e.target.value;
        console.log(`[useImageFrame] 내부 프레임 스타일 변경 - ID: ${image.id}, ${frameStyle} → ${newStyle}`);
        setFrameStyle(newStyle);
        // 🆕 내부 상태만 관리, 상위 호출은 DraggableImage에서 담당
    };

    return {
        frameStyle,
        setFrameStyle,
        getClipPath,
        getFrameStyle,
        handleFrameStyleChange,
    };
} 