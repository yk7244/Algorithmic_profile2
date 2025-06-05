import React, { useState} from 'react';
import { useDraggableImage } from './Hooks/useDraggableImage';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { RefreshCw} from 'lucide-react';

//refactoring
import ClusterDetailPanel from "./ClusterDetailPanel";
import ImageResearchModal from "./ImageRe-searchModal";
import { useImageSearch } from "./Hooks/useImageResearch_naver";
import { useImageFrame } from "./Hooks/useImageFrame";

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
    positions?: any;
    frameStyle: string;
    onFrameStyleChange: (id: string, style: string) => void;
    onImageChange: (id: string, src: string, keyword: string) => void;
    onImageSelect: (image: any) => void;
    isSelected: boolean;
    isSearchMode: boolean;
    onImageDelete: (id: string) => void;
}

// 모양별 정보 배열
const frameOptions = [
  { value: 'normal', icon: '⬛️', label: '나에게 힐링이 되는 영상' },
  //{ value: 'inspiration', icon: '⬡', label: '영감을 주는 영상' },
  { value: 'people', icon: '⚪️', label: '내가 좋아하는 사람' },
    //{ value: 'interest', icon: '🔶', label: '나만의 관심사' },
  //{ value: 'cloud', icon: '🌥️', label: '클라우드' },
  //{ value: 'heart', icon: '💖', label: '하트' },
  //{ value: 'pentagon', icon: '🔺', label: '펜타곤' },
  //{ value: 'star', icon: '⭐️', label: '별' },
  { value: 'pill', icon: '💊', label: '알약' },
  { value: 'wavy-star', icon: '🍪', label: '쿠키' },
];

const DraggableImage: React.FC<DraggableImageProps> = ({ 
    image, 
    position, 
    isEditing,
    frameStyle,
    onFrameStyleChange,
    onImageChange,
    onImageSelect,
    isSelected,
    isSearchMode,
}) => {
    const { attributes, listeners, setNodeRef, style } = useDraggableImage(
        image.id,
        isEditing,
        position,
        image.rotate
    );

    const [showImageModal, setShowImageModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showThumbnailModal, setShowThumbnailModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('search');

    const {
        alternativeImages,
        isLoadingImages,
        fetchAlternativeImages,
        handleImageSelect,
        setAlternativeImages,
    } = useImageSearch(image, showImageModal, onImageChange, setShowImageModal);

    const {
        frameStyle: updatedFrameStyle,
        getClipPath,
        getFrameStyle,
        handleFrameStyleChange,
    } = useImageFrame(frameStyle, image, onFrameStyleChange);

    // 버튼에서 직접 string 값을 넘길 수 있도록 래핑
    const handleFrameStyleChangeByValue = (value: string) => {
        // select 이벤트 mock 객체 생성
        handleFrameStyleChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>);
    };

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
                zIndex: isSelected ? 30 : 10,
                transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
                }}
                className={`${isEditing ? "cursor-move" : isSearchMode ? "cursor-pointer" : ""} ${
                isSelected ? "ring-4 ring-blue-500 ring-opacity-70 shadow-xl scale-105" : ""
                }`}
            >
                {/* 이미지 */}
                <div className={`absolute inset-0 transform ${!isEditing && isSearchMode ? 'transition-all duration-300 group hover:scale-110 hover:z-30' : ''} ${isEditing ? 'pointer-events-none' : ''}`}
                >
                    {/* 메인키워드 */}
                    <div 
                        className="absolute -top-10 z-20 whitespace-nowrap"
                        style={{
                        fontSize: '14px',
                        }}
                    >
                        <div 
                        className="px-8 py-4"
                        >
                        
                        <span className="font-bold text-gray-800">
                            #{image.main_keyword}
                        </span>
                        </div>
                    </div>

                    {/* 이미지 */}
                    <SheetTrigger asChild>
                        <div 
                        className={`relative w-full h-[calc(100%-40px)] ${updatedFrameStyle === 'people' ? 'overflow-hidden' : ''} ${!isEditing && !isSearchMode ? 'cursor-pointer' : ''} ${isEditing ? 'pointer-events-none' : ''}`}
                        >
                        <div
                            style={{
                            clipPath: getClipPath(),
                            }}
                            className={`relative w-full h-full ${getFrameStyle()} overflow-hidden`}
                        >
                            <img
                            src={image.src || "/images/default_image.png"}
                            alt={image.main_keyword}
                            className={`w-full h-full object-cover shadow-lg transition-transform duration-300 ${!isEditing && isSearchMode ? 'group-hover:scale-105' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing && isSearchMode) {
                                    onImageSelect(image);
                                } else if (!isEditing && !isSearchMode) {
                                    setShowDetails(true);
                                }
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // 기본 이미지이거나 이미 에러가 발생했으면 더 이상 시도하지 않음
                                if (target.src.includes('default_image.png') || target.dataset.errorHandled) return;
                                console.error('이미지 로드 실패:', target.src);
                                target.dataset.errorHandled = 'true'; // 에러 처리 완료 표시
                                target.src = "/images/default_image.png";
                            }}
                            />
                        </div>
                        
                        {/* 키워드를 이미지 하단에 배치 
                        <div className="absolute bottom-0.5 left-0 right-0 flex flex-wrap gap-1 justify-center items-center p-1">
                            {image.keywords.map((keyword: string, idx: number) => (
                            <span
                                key={idx}
                                className="inline-block px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm rounded-full shadow-sm transition-colors"
                            >
                                #{keyword}
                            </span>
                            ))}
                        </div>
                        
                        */}
                        
                        </div>
                    </SheetTrigger>
                </div>
                
                {/* 편집 모드-이미지 변경하기*/}
                {isEditing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {image.desired_self ? (
                    <button 
                        className="z-[60] flex items-center justify-center gap-1.5 py-2 px-4 min-w-[100px] bg-red-500/90 text-white 
                        backdrop-blur-sm rounded-full hover:bg-red-600 shadow-sm transition-colors pointer-events-auto"
                        onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDetails(true);
                        }}
                        onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        }}
                    >
                        <span className="text-sm font-medium">관심사 삭제하기</span>
                    </button>
                    ) : (
                    <button 
                        className="z-[60] group flex mb-10 items-center justify-center py-2 px-4 backdrop-blur-sm rounded-full 
                        hover:bg-white shadow-lg transition-all hover:scale-105 pointer-events-auto"
                        onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        }}
                    >
                        <RefreshCw 
                            className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300 cursor-pointer" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowImageModal(true);
                            }}
                        />
                    </button>
                    )}
                </div>
                )}
                {/* 편집 모드-프레임 변경하기*/}
                {isEditing && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto flex gap-2">
                    {frameOptions.map(opt => (
                        <button
                            key={opt.value}
                            className={`rounded-full text-sm px-2 py-1  rounded-full hover:bg-white shadow-lg transition-all hover:scale-105 z-20 pointer-events-auto ${updatedFrameStyle === opt.value ? 'border-blue-400' : 'border-transparent'}`}
                            onClick={() => {
                                handleFrameStyleChangeByValue(opt.value);
                                onFrameStyleChange(image.id, opt.value);
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            title={opt.label}
                            type="button"
                        >
                            <span>{opt.icon}</span>
                        </button>
                    ))}
                </div>
                )}
                {/* 편집 모드-드래그 가능한 영역*/}
                {isEditing && (
                <div
                    className="absolute inset-0 z-50"
                    {...listeners}
                    {...attributes}
                />
                )}
            </div>
        </Sheet>

        {/* 이미지 새로 검색하기 모달 */}
        <ImageResearchModal
            open={showImageModal}
            onOpenChange={setShowImageModal}
            image={image}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isLoadingImages={isLoadingImages}
            alternativeImages={alternativeImages}
            fetchAlternativeImages={fetchAlternativeImages}
            handleImageSelect={handleImageSelect}
            onImageChange={onImageChange}
            setShowThumbnailModal={setShowThumbnailModal}
        />

        {/*클러스터 상세 정보 패널 */}
        {showDetails && (
            <ClusterDetailPanel
                image={image}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                isEditing={isEditing}
                onImageSelect={onImageSelect}
            />
        )}
    </> 
    );
}

export default DraggableImage;