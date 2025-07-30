import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDraggableImage } from '@/app/my_profile/Draggable/Hooks/Drag/useDraggableImage';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ProfileData } from '@/app/types/profile';
//refactoring
import ClusterDetailPanel from '@/app/my_profile/Modal/ClusterDetailPanel';
import { useImageFrame } from '@/app/my_profile/Draggable/Hooks/Frame/useImageFrame';


// YouTube IFrame API 타입 선언 (TS 에러 방지)
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: (() => void) | undefined;
    }
}

// VideoData 타입 추가
export type VideoData = {
    title: string;
    embedId: string;
};
// DraggableImageProps 타입 정의 (필요에 따라 수정)
export interface DraggableImageProps {
    image: any;
    position?: { x: number; y: number };
    isEditing: boolean;
    frameStyle: string;
    onImageSelect: (image: any) => void;
    isOwner?: boolean;
    ownerId?: string;
    searchKeyword?: string;
    mainKeyword?: string;
    profile: ProfileData;
}


// TooltipWithPortal: 퍼센트 배지에 마우스 올릴 때 Portal로 툴팁 띄우기
function TooltipWithPortal({ children, tooltip, searchKeyword }: { children: React.ReactNode, tooltip: string, searchKeyword: string }) {
    const [show, setShow] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLSpanElement>(null);

    const handleMouseEnter = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({ x: rect.right + 16, y: rect.top + rect.height / 2 });
            setShow(true);
        }
    };
    const handleMouseLeave = () => setShow(false);

    return (
        <>
            <span
                ref={ref}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="bg-white/20 backdrop-blur-lg text-white font-bold px-2 py-0.5 rounded-full text-[12px] cursor-pointer"
            >
                {children}
            </span>
            {show && typeof window !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: coords.x,
                        top: coords.y,
                        transform: 'translateY(-50%)',
                        zIndex: 9999,
                    }}
                    className="absolute bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap pointer-events-none after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-r-white after:border-l-transparent after:mr-[-1px]"
                >
                    나의  
                    <span className="text-white font-bold bg-black/80 backdrop-blur-lg px-2 py-1 rounded-full text-[12px] ml-1"> #{searchKeyword}</span>
                    {tooltip}
                </div>,
                document.body
            )}
        </>
    );
}

const DraggableImage: React.FC<DraggableImageProps> = ({ 
    image, 
    position, 
    isEditing,
    frameStyle,
    onImageSelect,
    isOwner = true,
    ownerId,
    searchKeyword,
    mainKeyword,
    profile,
}) => {
    const { attributes, listeners, setNodeRef, style } = useDraggableImage(
        image.id,
        isEditing,
        position,
        image.rotate
    );

    const [imageLoadError, setImageLoadError] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showThumbnailModal, setShowThumbnailModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('search');
    const [showDeleteTooltip, setShowDeleteTooltip] = useState(false);

    // desired_self 여부에 따라 실제 크기 조절에 사용될 가중치 계산
    const effectiveSizeWeight = image.desired_self ? image.sizeWeight : (image.sizeWeight || 0.1) * 10;

    // effectiveSizeWeight를 기반으로 폰트 크기 계산
    const minFontSize = 10;
    const maxFontSize = 30;
    // effectiveSizeWeight의 예상 범위
    const minWeight = 0.15;
    const maxWeight = 1.5;

    const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
    
    // 가중치를 제한하고 0-1 범위로 정규화
    const clampedWeight = clamp(effectiveSizeWeight, minWeight, maxWeight);
    const normalizedRatio = (clampedWeight - minWeight) / (maxWeight - minWeight);

    // 제곱근을 사용하여 작은 값의 차이를 증폭
    const curvedRatio = Math.sqrt(normalizedRatio);
    
    const fontSize = minFontSize + curvedRatio * (maxFontSize - minFontSize);

    useEffect(() => {
        // src가 없거나 logo.png를 포함하는 경우, 유효하지 않은 것으로 간주합니다.
        const isInvalid = !image.src || image.src.includes('/images/logo.png');
        if (isInvalid) {
            const target = document.getElementById(image.id) as HTMLImageElement;
            if (target) {
                target.src = '/images/default_image.png';
            }
            setImageLoadError(true); // 이미지 로드 에러 상태 설정
        }
        // 이 효과는 이미지 소스가 바뀔 때마다 실행됩니다.
    }, [image.src, image.id]);

    
    const {
        frameStyle: updatedFrameStyle,
        getClipPath,
        getFrameStyle,
    } = useImageFrame(frameStyle, image, () => {});

    return (
    <>
        {/* 이미지 띄우기 */}
        <Sheet>
            <div
                ref={setNodeRef}
                data-id={image.id}
                style={{
                ...style,
                position: 'absolute',
                width: image.width * (image.desired_self ? image.sizeWeight : image.sizeWeight * 10),
                height: (image.height + 80) * (image.desired_self ? image.sizeWeight: image.sizeWeight * 10),
                touchAction: 'none',
                zIndex: 10,
                transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
                }}
                className={`group ${isEditing ? "cursor-move" : "cursor-pointer"}`}
            >
                {/* 이미지 묶음 */}
                <div className={`absolute inset-0  ${!isEditing ? 'transition-all duration-300 hover:scale-110 hover:z-30' : ''} ${isEditing ? 'pointer-events-none' : ''}`}
                >
                    {mainKeyword == image.main_keyword && (
                        <div className="text-blue-600/40 font-bold text-[12px] mr-1 -mt-2 mb-2"> 이전 페이지에서 발견한 알고리즘 정체성 키워드</div>
                    )} 
                    {/* 메인키워드 */}
                    <div 
                        className="absolute -top-6 z-20 whitespace-nowrap"
                        style={{
                        fontSize: `${fontSize}px`,
                        }}
                    >
                        
                        <div className="group relative -top-2">
                            {mainKeyword == image.main_keyword ? (
                                
                                <span className={`font-semibold text-blue-600`}>
                                    #{image.main_keyword}
                                </span>
                            ) : (
                                <span className={`font-semibold text-gray-800`}>
                                    #{image.main_keyword}
                                </span>
                            )}
                        </div>
                        
                    </div>

                    {/* 이미지 */}
                    <SheetTrigger asChild>
                        <div 
                        className={`group relative w-full h-[calc(100%-40px)] ${updatedFrameStyle === 'people' ? 'overflow-hidden' : ''} ${!isEditing ? 'cursor-pointer' : ''} ${isEditing ? 'pointer-events-none' : ''}`}
                        >
                        <div
                            style={{
                            ...getClipPath(),
                            }}
                            className={`group hover:scale-105 transition-transform duration-300 relative w-full h-full ${getFrameStyle()} overflow-hidden ${
                                false ? 'ring-2 ring-white ring-opacity-70 shadow-xl' : ''
                            }`}
                        >
                            <img
                                src={imageLoadError ? "/images/default_image.png" : image.src}
                                alt={image.main_keyword}
                                className={`group w-full h-full object-cover shadow-xl transition-transform duration-300 
                                    ${!isEditing ? 'group-hover:scale-105' : ''}
                                    ${image.main_keyword == mainKeyword ? 'border-2 border-blue-600' : ''}
                                    `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onImageSelect(image);
                                    setShowDetails(true);
                                }}
                                onError={() => setImageLoadError(true)}
                            />
                            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                                <TooltipWithPortal tooltip=" 키워드와 비슷한 정도예요" searchKeyword={searchKeyword || ''}>
                                    {(image as any).similarity * 100}%
                                </TooltipWithPortal>
                            </div>
                            
                        </div>
                        
                        
                        </div>
                    </SheetTrigger>
                </div>
                
                
                
            </div>
        </Sheet>

        

        {/*클러스터 상세 정보 패널 */}
        {showDetails && (
            <ClusterDetailPanel
                image={image}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                isEditing={isEditing}
                isOwner={isOwner}
                onImageSelect={onImageSelect}
                ownerId={ownerId} 
                profile={profile}
            />
        )}
    </> 
    );
}

export default DraggableImage;

