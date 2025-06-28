import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import type { VideoData } from "../Draggable/DraggableImage";

interface ImageResearchModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    image: any;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isLoadingImages: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    alternativeImages: any[];
    fetchAlternativeImages: () => void;
    loadMoreImages?: () => void;
    handleImageSelect: (img: any) => void;
    onImageChange: (id: string, src: string, keyword: string) => void;
    setShowThumbnailModal: (v: boolean) => void;
}

const getYouTubeThumbnail = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const ImageResearchModal: React.FC<ImageResearchModalProps> = ({
    open,
    onOpenChange,
    image,
    activeTab,
    setActiveTab,
    isLoadingImages,
    isLoadingMore = false,
    hasMore = true,
    alternativeImages,
    fetchAlternativeImages,
    loadMoreImages,
    handleImageSelect,
    onImageChange,
    setShowThumbnailModal,
}) => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        
        // 스크롤이 끝에서 100px 이내에 도달하면 더 많은 이미지 로드
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !isLoadingMore && loadMoreImages) {
            loadMoreImages();
        }
    };

    return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 gap-0 bg-gray-50 opacity-90 rounded-lg">
            <div className=" justify-center ">
                
            
                <div className="h-9/10 flex flex-col rounded-lg">
                    <div className="flex rounded-lg">
                        
                        {/* 왼쪽: 기존 이미지 */}
                        <div className="w-1/2 p-6 items-center bg-gray-50 bg-gray-50  opacity-90 rounded-lg">
                            <div className="p-6 ">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    '{image.main_keyword}'에 맞는<br/>
                                    더 적절한 사진을<br/>
                                    우측에서 골라보세요
                                </h2>
                                
                            </div>
                            <div className="p-6 items-center justify-center w-90 h-80 relative rounded-lg overflow-hidden">
                                <p className="text-md font-bold text-gray-700 mt-2 mb-4 ">현재 선택된 사진</p>
                                <img
                                    src={image.src}
                                    alt={image.main_keyword}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/default_image.png';
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* 오른쪽: 새 이미지 선택 */}
                        <div className="w-1/2 p-6 flex flex-col pr-12">
                            {/* 탭 메뉴 */}
                            <Tabs defaultValue="search" className="w-full flex-1 mt-10" value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2 ">
                                    <TabsTrigger value="thumbnails" className="font-medium data-[state=active]:bg-black data-[state=active]:text-white">
                                    내가 시청한 유튜브 썸네일
                                    </TabsTrigger>
                                    <TabsTrigger value="search" className="font-medium data-[state=active]:bg-black data-[state=active]:text-white">
                                    다른 관련 이미지
                                    </TabsTrigger>
                                    
                                    
                                </TabsList>
                                <TabsContent value="thumbnails" className="mt-10 flex-1 flex flex-col ">
                                    <div 
                                        className="overflow-y-auto border border-gray-200 rounded-lg p-3" 
                                        style={{ height: '350px' }}
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            {(image.relatedVideos || []).map((video: VideoData, idx: number) => (
                                                <div key={idx} className="relative group">
                                                    <div 
                                                        className="aspect-square rounded-lg overflow-hidden shadow-sm cursor-pointer border hover:shadow-md transition-all"
                                                        onClick={() => {
                                                            const thumbnailUrl = getYouTubeThumbnail(video.embedId);
                                                            onImageChange(image.id, thumbnailUrl, image.main_keyword);
                                                            setShowThumbnailModal(false);
                                                        }}
                                                    >
                                                        <img
                                                            src={getYouTubeThumbnail(video.embedId)}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/images/placeholder.jpg';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                        <button className="bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                                                            선택하기
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center mt-4 mb-22">
                                            * 시청하신 영상들의 썸네일 이미지를 보여드립니다.
                                        </div>
                                </TabsContent>
                                <TabsContent value="search" className="mt-0 flex-1 flex flex-col">
                                    {isLoadingImages ? (
                                        <div 
                                            className="overflow-y-auto border border-gray-200 rounded-lg p-3" 
                                            style={{ height: '350px' }}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, index) => (
                                                    <div key={index} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
                                                ))}
                                            </div>
                                        </div>
                                    ) : alternativeImages.length > 0 ? (
                                        <div 
                                            className="overflow-y-auto border border-gray-200 rounded-lg p-3" 
                                            style={{ height: '350px' }}
                                            onScroll={handleScroll}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                {alternativeImages.map((altImage) => (
                                                    <div 
                                                        key={altImage.id}
                                                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-sm border hover:shadow-md transition-all"
                                                        onClick={() => handleImageSelect(altImage)}
                                                    >
                                                        <img
                                                            src={altImage.urls.regular}
                                                            alt={altImage.alt_description || '대체 이미지'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/images/default_image.png';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button className="bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                                                                선택하기
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {/* 로딩 더 보기 인디케이터 */}
                                                {isLoadingMore && (
                                                    <div className="col-span-2 flex justify-center py-4">
                                                        <div className="flex items-center space-x-2 text-gray-500">
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                            <span className="text-sm">더 많은 이미지를 불러오는 중...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center border border-gray-200 rounded-lg" style={{ height: '350px' }}>
                                            <div className="text-gray-500">검색된 이미지가 없습니다.</div>
                                        </div>
                                    )}
                                    
                                    {/* 하단 정보 및 새로고침 버튼 */}
                                    <div className="mt-4 space-y-3">
                                        <div className="text-xs text-gray-500 text-center">
                                            * 현재 키워드 ({image.keywords?.join(', ') || image.main_keyword})에 맞는 이미지를 보여드립니다.
                                        </div>
                                        
                                    </div>
                                </TabsContent>
                                
                                
                            </Tabs>

                            
                        </div>
                        
                    </div>
                    
                </div>
                <div className="h-1/10 flex justify-center items-center ">
                    <button className="w-[200px] h-[50px] bg-black text-white px-4 py-2 rounded-full text-md font-medium shadow-sm">
                        변경하기
                    </button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    );
};

export default ImageResearchModal; 