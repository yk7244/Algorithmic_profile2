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

    // 프레임 스타일에 따라 클립패스 반환
    const getClipPath = () => {
        switch (frameStyle) {
        case 'nomal':
            return 'polygon(50% 0%, 61% 20%, 75% 20%, 80% 35%, 95% 40%, 90% 55%, 100% 65%, 90% 75%, 85% 90%, 70% 85%, 50% 100%, 30% 85%, 15% 90%, 10% 75%, 0% 65%, 10% 55%, 5% 40%, 20% 35%, 25% 20%, 39% 20%)';
        case 'interest':
            return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        //case 'cloud':
            // 클라우드 모양 근사치 (SVG path를 polygon으로 변환)
            //return 'polygon(20% 60%, 15% 45%, 20% 25%, 40% 28%, 45% 10%, 65% 10%, 70% 25%, 90% 25%, 90% 50%, 85% 60%, 95% 65%, 90% 85%, 70% 80%, 65% 90%, 45% 90%, 40% 80%, 20% 85%, 10% 70%, 20% 60%)';
        //case 'heart':
            // 하트 모양 근사치 (SVG path를 polygon으로 변환)
            //return 'polygon(50% 90%, 20% 70%, 0% 40%, 20% 20%, 30% 10%, 50% 20%, 50% 35%, 50% 20%, 70% 10%, 80% 20%, 100% 40%, 80% 70%, 50% 90%)';
        //case 'pentagon':
            //return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
        case 'star':
            // 새로운 별 모양 (SVG path를 polygon으로 변환)
            return 'polygon(12.5% 39.6%, 27.9% 60.2%, 22.4% 85%, 50% 78.1%, 75.8% 85.7%, 72.2% 60.4%, 85.2% 38.3%, 62.5% 34.4%, 50% 15.6%, 37.2% 33.9%)';
        case 'pill':
            // pill(알약) 모양 ellipse clip-path
            return 'ellipse(50% 50% at 50% 50%)';
        case 'wavy-star':
            // wavy-star(물결/톱니 별) 모양 근사치
            return 'polygon(15.6% 28.1%, 9.4% 31.3%, 12.5% 37.5%, 9.4% 43.8%, 12.5% 46.9%, 9.4% 53.1%, 12.5% 59.4%, 9.4% 62.5%, 12.5% 65.6%, 9.4% 71.9%, 12.5% 75%, 18.8% 71.9%, 25% 75%, 31.3% 71.9%, 37.5% 75%, 43.8% 71.9%, 50% 75%, 56.3% 71.9%, 62.5% 75%, 68.8% 71.9%, 75% 75%, 81.3% 71.9%, 84.4% 75%, 90.6% 71.9%, 87.5% 65.6%, 90.6% 59.4%, 87.5% 53.1%, 90.6% 46.9%, 87.5% 40.6%, 90.6% 37.5%, 87.5% 31.3%, 87.5% 25%, 81.3% 21.9%, 75% 25%, 68.8% 21.9%, 62.5% 25%, 56.3% 21.9%, 50% 25%, 43.8% 21.9%, 37.5% 25%, 31.3% 21.9%, 25% 25%, 18.8% 21.9%)';
        case 'cokie':
            // 쿠키 모양 근사치 (울퉁불퉁한 원형)
            return 'polygon(15.6% 28.1%, 9.4% 31.3%, 12.5% 37.5%, 9.4% 43.8%, 12.5% 46.9%, 9.4% 53.1%, 12.5% 59.4%, 9.4% 62.5%, 12.5% 65.6%, 9.4% 71.9%, 12.5% 75%, 18.8% 71.9%, 25% 75%, 31.3% 71.9%, 37.5% 75%, 43.8% 71.9%, 50% 75%, 56.3% 71.9%, 62.5% 75%, 68.8% 71.9%, 75% 75%, 81.3% 71.9%, 84.4% 75%, 90.6% 71.9%, 87.5% 65.6%, 90.6% 59.4%, 87.5% 53.1%, 90.6% 46.9%, 87.5% 40.6%, 90.6% 37.5%, 87.5% 31.3%, 87.5% 25%, 81.3% 21.9%, 75% 25%, 68.8% 21.9%, 62.5% 25%, 56.3% 21.9%, 50% 25%, 43.8% 21.9%, 37.5% 25%, 31.3% 21.9%, 25% 25%, 18.8% 21.9%)';
        default:
            return '';
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