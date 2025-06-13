import { useState, useEffect } from "react";

export function useImageFrame(frameStyleProp: string, image: any, onFrameStyleChange: (id: string, style: string) => void) {
    const [frameStyle, setFrameStyle] = useState(frameStyleProp);

    // frameStyleProp이 변경될 때마다 내부 frameStyle 상태를 업데이트
    useEffect(() => {
        //console.log(`[useImageFrame] useEffect 실행 - ID: ${image.id}, frameStyleProp: ${frameStyleProp}, 현재 내부 frameStyle: ${frameStyle}`);
        if (frameStyle !== frameStyleProp) {
            setFrameStyle(frameStyleProp);
            //console.log(`[useImageFrame] 내부 frameStyle을 ${frameStyleProp}(으)로 업데이트 함 - ID: ${image.id}`);
        } else {
            //console.log(`[useImageFrame] frameStyleProp (${frameStyleProp})과 내부 frameStyle (${frameStyle})이 동일하여 업데이트 안함 - ID: ${image.id}`);
        }
    }, [frameStyleProp, image.id, frameStyle]); // frameStyle도 의존성에 추가하여 무한 루프 방지 확인

    // 프레임 스타일에 따라 마스킹 스타일 반환 (polygon 또는 mask-image)
    const getClipPath = () => {
        switch (frameStyle) {
        case 'nomal':
            return { WebkitClipPath: 'polygon(50% 0%, 61% 20%, 75% 20%, 80% 35%, 95% 40%, 90% 55%, 100% 65%, 90% 75%, 85% 90%, 70% 85%, 50% 100%, 30% 85%, 15% 90%, 10% 75%, 0% 65%, 10% 55%, 5% 40%, 20% 35%, 25% 20%, 39% 20%)' };
        case 'interest':
            return { WebkitClipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
        case 'heart':
            // heart-removebg-preview.png 마스킹 적용
            return {
                WebkitMaskImage: "url('/images/heart-removebg-preview.png')",
                WebkitMaskSize: 'cover',
                maskImage: "url('/images/heart-removebg-preview.png')",
                maskSize: 'cover',
            };
        case 'star':
            return { WebkitClipPath: 'polygon(1.01% 39.39%, 31.26% 29.08%, 49.92% 3.03%, 68.43% 28.95%, 98.83% 39.38%, 80.31% 64.86%, 80.14% 98.21%, 50.61% 91.26%, 19.69% 98.21%, 19.2% 64.11%)' };
        case 'wavy-star':
            return { WebkitClipPath: 'polygon(15.6% 28.1%, 9.4% 31.3%, 12.5% 37.5%, 9.4% 43.8%, 12.5% 46.9%, 9.4% 53.1%, 12.5% 59.4%, 9.4% 62.5%, 12.5% 65.6%, 9.4% 71.9%, 12.5% 75%, 18.8% 71.9%, 25% 75%, 31.3% 71.9%, 37.5% 75%, 43.8% 71.9%, 50% 75%, 56.3% 71.9%, 62.5% 75%, 68.8% 71.9%, 75% 75%, 81.3% 71.9%, 84.4% 75%, 90.6% 71.9%, 87.5% 65.6%, 90.6% 59.4%, 87.5% 53.1%, 90.6% 46.9%, 87.5% 40.6%, 90.6% 37.5%, 87.5% 31.3%, 87.5% 25%, 81.3% 21.9%, 75% 25%, 68.8% 21.9%, 62.5% 25%, 56.3% 21.9%, 50% 25%, 43.8% 21.9%, 37.5% 25%, 31.3% 21.9%, 25% 25%, 18.8% 21.9%)' };
        case 'cokie':
            return { WebkitClipPath: 'polygon(11.79% 16.32%, 5% 21.41%, 8.39% 31.5%, 5% 41.68%, 8.39% 46.77%, 5% 56.86%, 8.39% 66.95%, 5% 72.04%, 8.39% 77.13%, 5% 87.22%, 8.39% 92.31%, 18.48% 87.22%, 28.57% 92.31%, 35.84% 87.22%, 45.93% 92.31%, 53.2% 87.22%, 61.37% 92.31%, 68.64% 87.22%, 76.81% 92.31%, 84.08% 87.22%, 91.35% 92.31%, 95% 87.22%, 98.39% 92.31%, 95% 82.13%, 98.39% 72.04%, 95% 61.95%, 98.39% 51.86%, 95% 41.77%, 98.39% 36.68%, 95% 26.59%, 100% 16.5%, 91.83% 11.41%, 84.56% 16.5%, 78.19% 11.41%, 71.82% 16.5%, 65.45% 11.41%, 59.08% 16.5%, 52.71% 11.41%, 46.34% 16.5%, 39.97% 11.41%, 33.6% 16.5%, 27.23% 11.41%, 18.16% 21.59%)' };
        default: 
            return {};
        }
    };

    // 프레임 스타일에 따라 Tailwind 클래스 반환
    const getFrameStyle = () => {
        switch (frameStyle) {
        case 'healing':
            return '';
        case 'inspiration':
            return '';
        case 'people':
            return 'rounded-full';
        case 'interest':
            return '';
        case 'pill':
            return 'rounded-[40px] h-[80px]';
        case 'heart':
            return '';
        default:
            return '';
        }
    };

    // 프레임 스타일 변경 핸들러
    const handleFrameStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStyle = e.target.value;
        //console.log(`[useImageFrame] handleFrameStyleChange 호출 - ID: ${image.id}, 새 스타일: ${newStyle}`);
        setFrameStyle(newStyle);
        onFrameStyleChange(image.id, newStyle);
    };

    return {
        frameStyle,
        setFrameStyle,
        getClipPath,
        getFrameStyle,
        handleFrameStyleChange,
    };
} 