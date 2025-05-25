import React, { useState} from 'react';
import { useDraggableImage } from './Hooks/useDraggableImage';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { RefreshCw} from 'lucide-react';

//refactoring
import ClusterDetailPanel from "./ClusterDetailPanel";
import ImageResearchModal from "./ImageResearchModal";
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

    return (
    <>
        {/* 이미지 띄우기 */}
        <Sheet>
        <div
            ref={setNodeRef}
            //이미지 띄우기
            style={{
            ...style,
            position: 'absolute',
            width: image.width * (image.desired_self ? image.sizeWeight * 2 : image.sizeWeight * 10),
            height: (image.height + 80) * (image.desired_self ? image.sizeWeight * 2 : image.sizeWeight * 10),
            left: image.left,
            top: image.top,
            //transform: 'translate(-100%, 80%)',
            transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
            touchAction: 'none',
            zIndex: isSelected ? 30 : 10,
            }}
            className={`${isEditing ? "cursor-move" : isSearchMode ? "cursor-pointer" : ""} ${
            isSelected ? "ring-4 ring-blue-500 ring-opacity-70 shadow-xl scale-105" : ""
            }`}
        >
            {/* 메인 키워드 - 편집 모드와 일반 모드 모두에서 표시 */}
            <div className={`absolute inset-0 transform ${!isEditing && isSearchMode ? 'transition-all duration-300 group hover:scale-110 hover:z-30' : ''}`}
            onClick={() => !isEditing && isSearchMode && onImageSelect(image)}
            >
            {/* 키워드 */}
            <div 
                className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-20 whitespace-nowrap 5"
                style={{
                fontSize: `${Math.max(80, 100 * image.sizeWeight)}px`,
                }}
            >
                <div 
                className="px-8 py-4 "
                style={{
                    transform: `scale(${image.sizeWeight})`,
                    transformOrigin: 'center',
                }}
                >
                <span className="font-bold text-gray-800">
                    #{image.main_keyword}
                </span>
                </div>
            </div>

            {/* 이미지 */}
            <SheetTrigger asChild>
                <div 
                className={`relative w-full h-[calc(100%-40px)] ${updatedFrameStyle === 'people' ? 'rounded-full overflow-hidden' : ''} ${!isEditing && !isSearchMode ? 'cursor-pointer' : ''}`}
                onClick={(e) => {
                    if (isEditing || isSearchMode) {
                    e.preventDefault();
                    } else {
                    setShowDetails(true);
                    }
                }}
                >
                <div
                    style={{
                    clipPath: getClipPath(),
                    }}
                    className={`relative w-full h-full ${getFrameStyle()} overflow-hidden`}
                >
                    <img
                    src={image.src || '/images/placeholder.jpg'}
                    alt={image.main_keyword}
                    className={`w-full h-full object-cover shadow-lg transition-transform duration-300 ${!isEditing && isSearchMode ? 'group-hover:scale-105' : ''}`}
                    onClick={(e) => {
                        console.log('이미지 정보:', image);
                        e.stopPropagation();
                        if (!isEditing && isSearchMode) {
                        onImageSelect(image);
                        }
                    }}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('이미지 로드 실패:', target.src);
                        target.src = '/images/placeholder.jpg';
                    }}
                    />
                </div>
                
                {/* 키워드를 이미지 하단에 배치 */}
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
                </div>
            </SheetTrigger>
            </div>
            
            {/* 편집 모드-이미지 변경하기*/}
            {isEditing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {image.desired_self ? (
                <button 
                    className="flex items-center justify-center gap-1.5 py-2 px-4 min-w-[100px] bg-red-500/90 text-white backdrop-blur-sm rounded-full hover:bg-red-600 shadow-sm transition-colors"
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
                    className="flex items-center justify-center gap-1.5 py-2 px-4 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-105 z-20"
                    onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowImageModal(true);
                    }}
                    onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    }}
                >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm font-medium">이미지 변경</span>
                </button>
                )}
            </div>
            )}
            {/* 편집 모드-프레임 변경하기*/}
            {isEditing && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-3 py-1 z-40">
                <select 
                className="text-sm border-none bg-transparent outline-none cursor-pointer"
                value={updatedFrameStyle}
                onChange={handleFrameStyleChange}
                onClick={(e) => e.stopPropagation()}
                >
                {image.desired_self ? (
                    <option value="star">⭐️ Desired_self</option>
                ) : (
                    <>
                    <option value="healing">⬛️ 나에게 힐링이 되는 영상</option>
                    <option value="inspiration">⬡ 영감을 주는 영상</option>
                    <option value="people">⚪️ 내가 좋아하는 사람</option>
                    <option value="interest">🔶 나만의 관심사</option>
                    </>
                )}
                </select>
            </div>
            )}
            {/* 편집 모드-드래그 가능한 영역*/}
            {isEditing && (
            <div
                className="absolute inset-0 z-10"
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

        {/* 드래그 가능한  클러스터 상세 정보 패널 */}
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