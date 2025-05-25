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
        <DialogContent className="max-w-[80vw] w-[80vw] min-w-[80vw] max-h-[80vh] h-[80vh] min-h-[80vh]">
        <DialogHeader>
            <DialogTitle>이미지 변경</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-6 h-[calc(100%-60px)]">
            {/* 기존 이미지 (좌측) */}
            <div className="col-span-6 flex items-center justify-center">
            <div className="w-[80%] aspect-square relative rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg">
                <img
                src={image.src}
                alt={image.main_keyword}
                className="w-full h-full object-cover"
                />
            </div>
            </div>
            {/* 새 이미지 선택 옵션 (우측) */}
            <div className="col-span-6 space-y-4">
            <Tabs defaultValue="search" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-3">
                <TabsList>
                    <TabsTrigger value="search" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    이미지 검색
                    </TabsTrigger>
                    <TabsTrigger value="thumbnails" className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M16 8h.01"/>
                    </svg>
                    관련 영상 썸네일
                    </TabsTrigger>
                </TabsList>
                {activeTab === 'search' && (
                    <button
                    onClick={fetchAlternativeImages}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                    <RefreshCw className="h-4 w-4" />
                    새로 검색
                    </button>
                )}
                </div>
                <TabsContent value="search" className="mt-0">
                {isLoadingImages ? (
                    <div className="grid grid-cols-2 gap-4 p-4">
                    {[1, 2, 3, 4].map((_, index) => (
                        <div key={index} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                    </div>
                ) : alternativeImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 p-4">
                    {alternativeImages.map((altImage) => (
                        <div 
                        key={altImage.id}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer group shadow-md"
                        onClick={() => handleImageSelect(altImage)}
                        >
                        <img
                            src={altImage.urls.regular}
                            alt={altImage.alt_description || '대체 이미지'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.jpg';
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-white transition-colors">
                            선택하기
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                    <div className="text-gray-500">검색된 이미지가 없습니다.</div>
                    </div>
                )}
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <div className="text-sm text-blue-600">
                    * 현재 키워드 ({image.keywords.join(', ')})에 맞는 이미지를 보여드립니다.
                    </div>
                </div>
                </TabsContent>
                <TabsContent value="thumbnails" className="mt-0">
                <div className="grid grid-cols-2 gap-4 p-4">
                    {image.relatedVideos.map((video: VideoData, idx: number) => (
                    <div key={idx} className="relative group">
                        <div 
                        className="aspect-video rounded-lg overflow-hidden shadow-lg cursor-pointer"
                        onClick={() => {
                            const thumbnailUrl = getYouTubeThumbnail(video.embedId);
                            onImageChange(image.id, thumbnailUrl, image.main_keyword);
                            setShowThumbnailModal(false);
                        }}
                        >
                        <img
                            src={getYouTubeThumbnail(video.embedId)}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.jpg';
                            }}
                        />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                            className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            이미지로 변경하기
                        </button>
                        </div>
                        <div className="mt-2 text-sm font-medium line-clamp-2">
                        {video.title}
                        </div>
                    </div>
                    ))}
                </div>
                </TabsContent>
            </Tabs>
            </div>
        </div>
        </DialogContent>
    </Dialog>
);

export default ImageResearchModal; 