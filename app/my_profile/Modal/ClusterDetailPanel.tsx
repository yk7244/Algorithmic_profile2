import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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
        const [currentPage, setCurrentPage] = useState(1); // 페이지 상태 추가
        const [showWatchHistory, setShowWatchHistory] = useState(false); // 시청기록 토글
        const [showRecommendations, setShowRecommendations] = useState(false); // 추천영상 토글
        const router = useRouter();
        const { handleAddAsInterest } = useAddAsInterest(setShowDetails);
        const { isLoading: isLoadingAiVideos, videos: aiRecommendedVideos, fetchAndSet: fetchAndSetVideos, nextPageToken } = useRecommend(image);

        useEffect(() => {
            if (showDetails && image.main_keyword && (isOwner || image.desired_self)) {
                fetchAndSetVideos();
            }
        }, [showDetails, fetchAndSetVideos, isOwner, image.main_keyword, image.desired_self]);

        // 모달이 열릴 때마다 첫 번째 페이지로 초기화
        useEffect(() => {
            if (showDetails) {
                setCurrentPage(1);
                setShowWatchHistory(false);
                setShowRecommendations(false);
            }
        }, [showDetails]);

        // 이미지 클릭 핸들러 (상세 패널에서 이미지 클릭 시)
        const handleImageClick = () => {
            if (!isEditing && onImageSelect) {
                onImageSelect(image);
            }
        };

        // 영상 클릭 핸들러 (시청 기록 관리)
        const handleVideoClick = (video: VideoData) => {
            saveWatchedVideoToLocalStorage(video, ownerId || 'guest');
            setWatchedVideos(prev => [...new Set([...prev, video.embedId])]);
        };

        // 프로필 방문 핸들러
        const handleVisitProfile = () => {
            if (image.desired_self_profile) {
                router.push(`/others_profile/${image.desired_self_profile}`);
            }
        };

        if (!image) return null;

        return (
        <Dialog open={showDetails} onOpenChange={setShowDetails} >
            <DialogContent className="fixed left-1/2 top-1/2 w-[36vw] min-w-[32rem] max-w-3xl h-[90vh] -translate-x-0 -translate-y-1/2 border-20 bg-background p-0 shadow-lg flex flex-col overflow-hidden rounded-2lg">
                
                {/* 페이지 1: 풀스크린 이미지 배경과 텍스트 오버레이 */}
                {currentPage === 1 && (
                    <div className="relative w-full h-full flex flex-col">
                        {/* 풀스크린 배경 이미지 */}
                        <div className="absolute inset-0 w-full h-full">
                            <img
                                src={image.src}
                                alt={image.main_keyword}
                                className="w-full h-full object-cover"
                                onClick={handleImageClick}
                                onError={(e) => {
                                    e.currentTarget.style.backgroundColor = 'gray';
                                }}
                            />
                            {/* 어두운 오버레이 */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                            
                            {/* 상단 검정 그라데이션 */}
                            <div className="absolute top-0 left-0 right-0 h-3/5 bg-gradient-to-b from-black/80 via-black/40 to-transparent " />
                            
                            {/* 하단 검정 그라데이션 */}
                            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                        </div>

                        {/* 상단 헤더 */}
                        <div className="relative z-40 flex justify-end p-6">
                            <DialogClose className="rounded-full backdrop-blur-sm p-2 text-white hover:bg-black/50 transition-all">
                                <X className="h-6 w-6" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>

                        {/* 메인 콘텐츠 - 중앙 정렬 */}
                        <div className="relative z-30 flex-1 flex flex-col px-1 sm:px-12 text-white">
                            {/* 메인 키워드 */}
                            <div className="text-left mb-1">
                                <h1 className="text-3xl  font-bold mb-4 tracking-wide">
                                    #{image.main_keyword}
                                </h1>
                                
                                {/* 카테고리와 관심도 뱃지 */}
                                <div className="flex justify-left gap-4 mb-6">
                                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                                        {image.category}
                                    </span>
                                    
                                </div>
                            </div>

                            {/* 설명 */}
                            <div className="text-left mb-8 max-w-2xl mx-auto">
                                <p className="text-[15px] leading-relaxed text-white/90 mb-2">
                                    {image.description}
                                    <br />
                                    <br />
                                    <span className="text-white/90 font-bold"> #{image.main_keyword} </span>
                                    와 관련된 키워드는 
                                    {image.keywords.map((keyword: string) => (
                                        <span key={keyword} className="text-blue-200 font-bold "> #{keyword} </span>
                                    ))}
                                    이 있어요.
                                </p>
                            </div>

                            
                        </div>

                        {/* 하단 버튼 */}
                        {isOwner && !image.desired_self && (
                        <div className="text-center mb-8 max-w-2xl mx-auto text-white/90">
                            <p className="backdrop-blur-sm text-white  px-8 py-4 rounded-full 
                            flex items-center text-base font-medium transition-all duration-300 "
                            
                            >
                                이 키워드는 당신의 추천 알고리즘에&nbsp;
                                <span className={`rounded-full font-bold animate-pulse duration-1000`}
                                style={{
                                    animation: 'pulse 1s ease-in-out infinite'
                                }}
                                >
                                    {image.sizeWeight >= 1.2 ? ' 큰 영향 ' : image.sizeWeight >= 0.8 ? ' 중간 영향 ' : ' 작은 영향 '}
                                </span>
                                을 주고 있어요.
                            </p>
                        </div>
                        )}
                        <div className="relative z-30 flex justify-center pb-8">
                                
                            <Button
                                onClick={() => setCurrentPage(2)}
                                className="font-bold bg-black/100 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-6 rounded-full flex items-center 
                                gap-4 text-base font-medium transition-all duration-1000 hover:scale-105
                                shadow-[0_0_30px_rgba(255,255,255,0.3),inset_0_2px_10px_rgba(255,255,255,0.1),inset_0_-2px_10px_rgba(0,0,0,0.3)]
                                "
                            >
                                
                                <ChevronDown className="h-5 w-5" />
                                알고리즘 더 살펴보기   
                            </Button>
                        </div>
                    </div>
                )}

                {/* 페이지 2: 영상과 상세 분석 */}
                {currentPage === 2 && (
                    <>
                        {/* 헤더 - 전체 이미지 배경 */}
                        <div className="relative w-full flex-shrink-0 overflow-hidden"
                        style={{
                            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3), rgba(0,0,0,0)), url(${image.src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            minHeight: "200px",
                        }}>
                            {/* 상단 네비게이션 */}
                            <div className="relative z-20 flex items-center justify-between px-6 py-4">
                                <Button
                                    onClick={() => setCurrentPage(1)}
                                    variant="ghost"
                                    className="text-white hover:bg-white/20 p-2 rounded-full backdrop-blur-sm"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                
                            </div>
                            
                            {/* 메인 키워드 섹션 */}
                            
                            <div className="relative z-10 px-8 pb-8">
                                <h1 className="text-2xl font-bold mb-6 text-white">
                                    #{image.main_keyword}
                                </h1>
                                {/* 설명 텍스트 */}
                                {isOwner && !image.desired_self && (
                                <div className="text-left max-w-2xl text-white/90">
                                    <p className="backdrop-blur-sm bg-black/30 text-white px-6 py-3 rounded-3xl 
                                    text-sm font-medium transition-all duration-300"
                                    style={{
                                        animation: 'pulse 4s ease-in-out infinite'
                                    }}>
                                        이 키워드는 당신의 추천 알고리즘에&nbsp;
                                        <span className={`ml-1 font-bold`}>
                                            {image.sizeWeight >= 1.2 ? '큰 영향' : image.sizeWeight >= 0.8 ? '중간 영향' : '작은 영향'}
                                        </span>
                                        을 주고 있어요.
                                    </p>
                                </div>
                                )}
                            </div>
                            
                        </div>

                        {/* 스크롤 가능한 영상 콘텐츠 영역 */}
                        <div className="flex-grow overflow-y-auto bg-gray-50">
                            <div className="px-8 py-6">
                                <div className="">
                                    {/* 내 프로필일 때 */}
                                    {isOwner ? (
                                        <>
                                            {/* 일반 클러스터 */}
                                            {!image.desired_self ? (
                                                <>
                                                <p className="mb-4 text-md text-gray-600 font-bold"> 아래의 {image.relatedVideos.length}개의 시청 기록들이 알고리즘에 반영되었어요.</p>
                                    
                                                {!showWatchHistory && (
                                                    <Button
                                                        onClick={() => setShowWatchHistory(true)}
                                                        className="bg-black hover:bg-black/80 text-white rounded-lg text-sm font-medium transition-all duration-300"
                                                    >
                                                        보기
                                                    </Button>
                                                )}
                                                {showWatchHistory && (
                                                    <VideoList
                                                        videos={image.relatedVideos || []}
                                                        watchedVideos={watchedVideos}
                                                        onVideoClick={handleVideoClick}
                                                        
                                                    />
                                                )}
                                                
                                                <p className="mt-10 mb-4 text-md text-gray-600 font-bold">
                                                    앞으로 아래와 같은 영상들을 추천받게 될거에요.
                                                </p>
                                                {!showRecommendations && (
                                                    <Button
                                                        onClick={() => setShowRecommendations(true)}
                                                        className="bg-black hover:bg-black/80 text-white rounded-lg text-sm font-medium transition-all duration-300"
                                                    >
                                                        보기
                                                    </Button>
                                                )}
                                                
                                                {showRecommendations && (
                                                    <>
                                                        <VideoList
                                                            isLoading={isLoadingAiVideos}
                                                            videos={aiRecommendedVideos}
                                                            watchedVideos={watchedVideos}
                                                            onVideoClick={handleVideoClick}
                                                            titlePrefix="AI 추천: "
                                                            isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0)}
                                                            emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                                            onRetry={fetchAndSetVideos}
                                                        />
                                                        {nextPageToken && (
                                                            <div className="flex justify-center mt-4">
                                                                <Button
                                                                    onClick={() => fetchAndSetVideos(true)}
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transition-all duration-300"
                                                                >
                                                                    더보기
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                </>
                                            ) : (
                                                /* 관심사 클러스터 */
                                                <div className="space-y-6">
                                                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-6">
                                                        <div className="text-center space-y-3">
                                                            <h3 className="text-base font-semibold text-gray-800">
                                                                이 이미지의 원본 프로필
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                이 이미지를 가져온 프로필을 방문하여 더 많은 관심사를 발견해보세요
                                                            </p>
                                                            <Button
                                                                onClick={handleVisitProfile}
                                                                className="bg-black hover:bg-black/80 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                                                            >
                                                                프로필 방문하기
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-md text-gray-600 font-bold mb-4">
                                                    이 알고리즘의 원본 프로필에서 추천된 영상들이에요.
                                                    <br/>
                                                    
                                                        {!showRecommendations && (
                                                            <Button
                                                                onClick={() => setShowRecommendations(true)}
                                                                className="mt-4 bg-black hover:bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                                                            >
                                                                보기
                                                            </Button>
                                                        )}
                                                    </p>
                                                    
                                                    {showRecommendations && (
                                                        <>
                                                            <VideoList
                                                                isLoading={isLoadingAiVideos}
                                                                videos={aiRecommendedVideos}
                                                                watchedVideos={watchedVideos}
                                                                onVideoClick={handleVideoClick}
                                                                titlePrefix="AI 추천: "
                                                                isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0)}
                                                                emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                                                onRetry={fetchAndSetVideos}
                                                            />
                                                            {nextPageToken && (
                                                                <div className="flex justify-center mt-4">
                                                                    <Button
                                                                        onClick={() => fetchAndSetVideos(true)}
                                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transition-all duration-300"
                                                                    >
                                                                        더보기
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        /* 다른 사람의 프로필일 때 */
                                        <>
                                            {!isOwner && (
                                                <div className="fixed bottom-6 left-6 right-6 z-50">
                                                    <Button
                                                        className="w-full bg-black hover:bg-gray-800 text-white px-6 py-6 rounded-full text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                                                        onClick={() => handleAddAsInterest(image, ownerId)}
                                                    >
                                                        새로운 관심사로 추가하기
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            <VideoList
                                                isLoading={isLoadingAiVideos}
                                                videos={aiRecommendedVideos}
                                                watchedVideos={watchedVideos}
                                                onVideoClick={handleVideoClick}
                                                titlePrefix="AI 추천: "
                                                isError={!isLoadingAiVideos && (!aiRecommendedVideos || aiRecommendedVideos.length === 0)}
                                                emptyMessage="AI 추천 영상을 가져올 수 없습니다."
                                                onRetry={fetchAndSetVideos}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ClusterDetailPanel; 