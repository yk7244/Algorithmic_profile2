import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import type { VideoData } from "./DraggableImage";

interface ImageResearchModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    image: any;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isLoadingImages: boolean;
    alternativeImages: any[];
    fetchAlternativeImages: () => void;
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
    alternativeImages,
    fetchAlternativeImages,
    handleImageSelect,
    onImageChange,
    setShowThumbnailModal,
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 gap-0 bg-gray-50 opacity-90 rounded-lg">
            <div className="flex flex-col h-full rounded-lg">
                <div className="flex flex-1 min-h-0 rounded-lg">
                    
                    {/* 왼쪽: 기존 이미지 */}
                    <div className="w-1/2 p-6 items-center bg-gray-50 bg-gray-50  opacity-90 rounded-lg">
                        <div className="p-6 ">
                            <h2 className="text-2xl font-bold text-gray-900">
                                키워드 '{image.main_keyword}' 의<br/>
                                분위기에 어울리는<br/>
                                사진으로 바꿔보세요
                            </h2>
                            
                        </div>
                        <div className="p-6 items-center justify-center w-90 h-80 relative rounded-lg overflow-hidden">
                            <p className="text-lg font-bold text-gray-700 mt-2 mb-4 ">#{image.main_keyword}</p>
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
                    <div className="w-1/2 p-6 flex flex-col ">
                        {/* 탭 메뉴 */}
                        <Tabs defaultValue="search" className="w-full flex-1 mt-10" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 mb-4 p-2">
                                <TabsTrigger value="search" className="font-medium data-[state=active]:bg-black data-[state=active]:text-white">
                                    이미지 검색
                                </TabsTrigger>
                                <TabsTrigger value="thumbnails" className="font-medium data-[state=active]:bg-black data-[state=active]:text-white">
                                    유튜브 썸네일
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="search" className="mt-0 flex-1 flex flex-col">
                                {isLoadingImages ? (
                                    <div className="grid grid-cols-2 gap-3 flex-1">
                                        {[1, 2, 3, 4].map((_, index) => (
                                            <div key={index} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
                                        ))}
                                    </div>
                                ) : alternativeImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 flex-1">
                                        {alternativeImages.slice(0, 4).map((altImage) => (
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
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-gray-500">검색된 이미지가 없습니다.</div>
                                    </div>
                                )}
                                
                                {/* 하단 정보 및 새로고침 버튼 */}
                                <div className="mt-4 space-y-3">
                                    <div className="text-xs text-gray-500 text-center">
                                        * 현재 키워드 ({image.keywords?.join(', ') || image.main_keyword})에 맞는 이미지를 보여드립니다.
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={fetchAlternativeImages}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-sm font-medium"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="thumbnails" className="mt-0 flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                    {(image.relatedVideos || []).slice(0, 4).map((video: VideoData, idx: number) => (
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
                                <div className="text-xs text-gray-500 text-center mt-4 mb-22">
                                        * 시청하신 영상들의 썸네일 이미지를 보여드립니다.
                                    </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);

export default ImageResearchModal; 