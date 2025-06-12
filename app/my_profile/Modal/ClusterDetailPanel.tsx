import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogClose 
} from "@/components/ui/dialog";
import { VideoData } from "../Draggable/DraggableImage";   
import { useRouter } from 'next/navigation';
import { useAddAsInterest } from "@/app/others_profile/hooks/useAddAsInterest";
import { saveWatchedVideoToLocalStorage } from './Hooks/saveExploreWatchHistory';
import { useRecommend } from './Hooks/useRecommend';
import VideoList from './Hooks/VideoList'; 

interface ClusterDetailPanelProps {
    image: any;
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    isEditing?: boolean;
    onImageSelect?: (img: any) => void;
    isOwner?: boolean;
    ownerId?: string;
}

const ClusterDetailPanel: React.FC<ClusterDetailPanelProps> = ({
        image,
        showDetails,
        setShowDetails,
        isEditing,
        onImageSelect,
        isOwner = true,
        ownerId,
    }) => {
        if (!showDetails) return null;

        const [watchedVideos, setWatchedVideos] = useState<string[]>([]);   
        const router = useRouter();
        const { handleAddAsInterest } = useAddAsInterest(setShowDetails);
        const { isLoading: isLoadingAiVideos, videos: aiRecommendedVideos, fetchAndSet: fetchAndSetVideos } = useRecommend(image);

        useEffect(() => {
            if (showDetails && image.main_keyword && (isOwner || image.desired_self)) {
                fetchAndSetVideos();
            }
        }, [showDetails, fetchAndSetVideos, isOwner, image.main_keyword, image.desired_self]);

        // 이미지 클릭 핸들러 (상세 패널에서 이미지 클릭 시)
        const handleImageClick = () => {
            if (!isEditing && onImageSelect) {
                onImageSelect(image);
            }
        };

        // 영상 클릭 핸들러 (시청 기록 관리)
        const handleVideoClick = async (video: VideoData) => {
            await saveWatchedVideoToLocalStorage(video, ownerId || 'guest');
            setWatchedVideos(prev => [...new Set([...prev, video.embedId])]);
        };

        // 🆕 relatedVideos 데이터 정규화 (기존 잘못된 형태 호환)
        const normalizeRelatedVideos = (relatedVideos: any[]): VideoData[] => {
            if (!relatedVideos || !Array.isArray(relatedVideos)) {
                return [];
            }

            return relatedVideos
                .map((video: any): VideoData | null => {
                    // 올바른 형태: { title: string, embedId: string }
                    if (video.title && video.embedId) {
                        return {
                            title: video.title,
                            embedId: video.embedId
                        };
                    }
                    
                    // 잘못된 형태: { url: string } - URL에서 정보 추출 시도
                    if (video.url) {
                        const videoIdMatch = video.url.match(/(?:v=|youtu\.be\/)([^&?]+)/);
                        if (videoIdMatch) {
                            return {
                                title: `YouTube 영상 (${videoIdMatch[1]})`,
                                embedId: videoIdMatch[1]
                            };
                        }
                    }
                    
                    // 문자열인 경우 (제목으로 가정)
                    if (typeof video === 'string') {
                        // URL인지 확인
                        const videoIdMatch = video.match(/(?:v=|youtu\.be\/)([^&?]+)/);
                        if (videoIdMatch) {
                            return {
                                title: `YouTube 영상 (${videoIdMatch[1]})`,
                                embedId: videoIdMatch[1]
                            };
                        }
                        // 일반 제목으로 처리 (embedId가 없어서 재생 불가)
                        return null;
                    }
                    
                    return null;
                })
                .filter((video): video is VideoData => video !== null && video.embedId !== '');
        };

        const normalizedRelatedVideos = normalizeRelatedVideos(image.relatedVideos || []);

        // 프로필 방문 핸들러
        const handleVisitProfile = () => {
            if (image.desired_self_profile) {
                router.push(`/others_profile/${image.desired_self_profile}`);
            }
        };

        if (!image) return null;

        return (
        <Dialog open={showDetails} onOpenChange={setShowDetails} >
            <DialogContent className="fixed left-1/2 top-1/2 w-[36vw] max-w-3xl h-[90vh] -translate-x-0 -translate-y-1/2 border-0 bg-background p-0 shadow-lg flex flex-col overflow-hidden">
                {/* 상단 썸네일 이미지 + 제목/닫기버튼 오버레이 */}
                <div className="relative w-full h-[150px] sm:h-[220px] flex-shrink-0 ">
                    <img
                        src={image.src}
                        alt={image.main_keyword}
                        className="w-full h-full object-cover"
                        onClick={handleImageClick}
                        onError={(e) => {
                            e.currentTarget.style.backgroundColor = 'gray';
                        }}
                    />
                    <DialogHeader className="absolute left-0 top-0 w-full h-full flex flex-col items-start justify-start px-4 pt-4 z-30 pointer-events-none">
                        <div className="flex items-center w-full justify-between pointer-events-auto">
                            <DialogTitle className="text-lg sm:text-xl font-bold text-white  px-3 py-1 truncate">
                                #{image.main_keyword}
                            </DialogTitle>
                        </div>
                    </DialogHeader>
                    {/* 카테고리 뱃지: 이미지 좌측 하단 */}
                    <span className="absolute left-4 bottom-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-medium z-30">
                        {image.category}
                    </span>
                    {/* 관심도 뱃지: 이미지 우측 하단 */}
                    <span className={`absolute right-4 bottom-4 px-3 py-1 rounded-full text-xs font-bold z-30
                        ${image.sizeWeight >= 1.2 ? 'bg-red-500 text-white' : image.sizeWeight >= 0.8 ? 'bg-yellow-400 text-gray-900' : 'bg-blue-400 text-white'}`}
                    >
                        {image.sizeWeight >= 1.2 ? '관심도:강' : image.sizeWeight >= 0.8 ? '관심도:중' : '관심도:약'}
                    </span>
                    {/* 하단 그라데이션 오버레이로 텍스트 가독성 향상 */}
                    <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
                </div>
                {/* 나머지 내용 (스크롤 가능 영역) */}
                <div className="flex-grow overflow-y-auto px-6 sm:px-10">
                    <div className="flex flex-col w-full mx-auto pb-14 pt-6">
                        {/* 클러스터 Description*/}
                        <p className="text-xs sm:text-[12px] font-bold text-purple-900">{image.mood_keyword}</p>
                        <p className="text-[12px] pt-2 text-gray-700">{image.description}</p>
                        
                        {/* keywords list 섹션 */}
                        <div className="mt-3 sm:mt-4">
                            <div className="flex flex-wrap gap-2">
                            {(image.keywords || []).map((keyword: string, idx: number) => (
                                <span
                                key={idx}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                #{keyword}
                                </span>
                            ))}
                            </div>
                        </div>
                        
                        {/* 영상 탭 섹션-> 나의 클러스터 분석일때, 다른 사람의 클러스터 분석일때*/}
                        <div className="space-y-6 pb-1 pt-4">
                            {isOwner ? (
                                <>
                                {/* 나의 클러스터 분석일때 */}
                                    {!image.desired_self ? (
                                    //나의 클러스터 분석일때
                                    <Tabs defaultValue="history" className="w-full">
                                        <div className="bg-gray-70/70 rounded-lg ">
                                            {/* 탭 목록 */}
                                            <TabsList className={`w-full grid ${isOwner ? 'grid-cols-2' : 'grid-cols-1'} py-0 `}>
                                                <TabsTrigger value="history" className="text-[12px] py-1">Where this image from</TabsTrigger>
                                                <TabsTrigger value="AI" className="text-[12px] py-1">The way Algorithm see you</TabsTrigger>
                                            </TabsList>
                                            <br/> <br/>
                                            {/* 관련 영상 탭 */}
                                            <TabsContent value="history" className="px-4 pb-4">
                                                <VideoList
                                                    videos={normalizedRelatedVideos}
                                                    watchedVideos={watchedVideos}
                                                    onVideoClick={handleVideoClick}
                                                />
                                            </TabsContent>
                                            {/* AI 추천 영상 탭 */}
                                            <TabsContent value="AI" className="px-4 pb-4">
                                                <VideoList
                                                    isLoading={isLoadingAiVideos}
                                                    videos={aiRecommendedVideos}
                                                    watchedVideos={watchedVideos}
                                                    onVideoClick={handleVideoClick}
                                                    titlePrefix="AI 추천: "
                                                    isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0 || aiRecommendedVideos[0].embedId === '')}
                                                    emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                                    onRetry={fetchAndSetVideos}
                                                />
                                            </TabsContent>
                                            
                                        </div>
                                    </Tabs>
                                    ) : (
                                    //Desired_self 클러스터일땐, AI만 보여줌
                                    <div className="space-y-6">
                                        {/* 이 이미지의 원본 프로필 탭 */}
                                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                                            <div className="text-center space-y-3">
                                                <h3 className="text-base font-semibold text-gray-800">
                                                이 이미지의 원본 프로필
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                이 이미지를 가져온 프로필을 방문하여 더 많은 관심사를 발견해보세요
                                                </p>
                                                <Button
                                                onClick={handleVisitProfile}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                                                >
                                                프로필 방문하기
                                                </Button>
                                            </div>
                                        </div>
                                        {/* AI 추천 영상 로딩 중 */}
                                        <VideoList
                                            isLoading={isLoadingAiVideos}
                                            videos={aiRecommendedVideos}
                                            watchedVideos={watchedVideos}
                                            onVideoClick={handleVideoClick}
                                            titlePrefix="AI 추천: "
                                            isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0 || aiRecommendedVideos[0].embedId === '')}
                                            emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                            onRetry={fetchAndSetVideos}
                                        />
                                    </div>
                                    )}
                                </>
                            ):(
                                <>
                                {/* 다른 사람의 프로필 페이지에서의 클러스터 분석일때 */}
                                    {/* Desired 추가하는거 */}
                                        <Button
                                            className="fixed bottom-10 z-[10] w-90% right-4 p-8 bg-black hover:from-purple-600 hover:to-pink-600 text-white px-6 py-7 
                                            rounded-full text-sm font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                                            onClick={() => handleAddAsInterest(image, ownerId)}
                                        >
                                            새로운 관심사로 추가하기
                                        </Button>
                                    {image.desired_self && (
                                    <>
                                        {/* Desired_self 가져온 프로필 */}
                                        <div className="space-y-6">
                                            {/* 이 이미지의 원본 프로필 탭 */}
                                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                                                <div className="text-center space-y-3">
                                                    <h3 className="text-base font-semibold text-gray-800">
                                                    이 이미지의 원본 프로필
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                    이 이미지를 가져온 프로필을 방문하여 더 많은 관심사를 발견해보세요
                                                    </p>
                                                    <Button
                                                    onClick={handleVisitProfile}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                                                    >
                                                    프로필 방문하기
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* AI 추천 영상 */}
                                            <VideoList
                                                isLoading={isLoadingAiVideos}
                                                videos={aiRecommendedVideos}
                                                watchedVideos={watchedVideos}
                                                onVideoClick={handleVideoClick}
                                                titlePrefix="AI 추천: "
                                                isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0 || aiRecommendedVideos[0].embedId === '')}
                                                emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                                onRetry={fetchAndSetVideos}
                                            />
                                        </div>
                                    </>
                                    )}
                                    {/* 본인꺼 클러스터일때 */}
                                    {/* AI영상 탭 */}
                                    <VideoList
                                        isLoading={isLoadingAiVideos}
                                        videos={aiRecommendedVideos}
                                        watchedVideos={watchedVideos}
                                        onVideoClick={handleVideoClick}
                                        titlePrefix="AI 추천: "
                                        isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0 || aiRecommendedVideos[0].embedId === '')}
                                        emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                        onRetry={fetchAndSetVideos}
                                    />
                                </> 
                            )}
                            
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ClusterDetailPanel; 