import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoData } from "./DraggableImage";
import { useRouter } from 'next/navigation';

interface ClusterDetailPanelProps {
    image: any;
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    isEditing?: boolean;
    onImageSelect?: (img: any) => void;
}

const ClusterDetailPanel: React.FC<ClusterDetailPanelProps> = ({
        image,
        showDetails,
        setShowDetails,
        isEditing,
        onImageSelect,
    }) => {
        if (!showDetails) return null;

        const [aiRecommendedVideos, setAiRecommendedVideos] = useState<VideoData[]>([]);
        const [isLoadingAiVideos, setIsLoadingAiVideos] = useState(false);
        const [watchedVideos, setWatchedVideos] = useState<string[]>([]);   
        const router = useRouter();

        // AI 추천 유튜브 비디오 가져오기
        const fetchAiRecommendedVideos = useCallback(async () => {
            if (!image.main_keyword) return;
            setIsLoadingAiVideos(true);
            try {
                const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
                if (!API_KEY) {
                    console.error('YouTube API 키가 설정되지 않았습니다.');
                    throw new Error('API 키가 없습니다.');
                }
                const randomKeyword = image.keywords[Math.floor(Math.random() * image.keywords.length)];
                const searchQuery = `${image.main_keyword} ${randomKeyword}`;
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=4&regionCode=KR&key=${API_KEY}`
                );
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('YouTube API 오류:', errorData);
                    throw new Error(`YouTube API 오류: ${response.status}`);
                }
                const data = await response.json();
                if (data.items) {
                    const videoList = data.items.map((item: any) => ({
                        title: item.snippet.title,
                        embedId: item.id.videoId
                    }));
                    setAiRecommendedVideos(videoList);
                }
            } catch (error) {
                console.error('AI 추천 비디오 가져오기 오류:', error);
                setAiRecommendedVideos([]);
                const fallbackVideos = [
                    {
                        title: '추천 영상을 불러올 수 없습니다.',
                        embedId: ''
                    }
                ];
                setAiRecommendedVideos(fallbackVideos);
            } finally {
                setIsLoadingAiVideos(false);
            }
        }, [image.main_keyword, image.keywords]);

        useEffect(() => {
            if (!isEditing) {
                fetchAiRecommendedVideos();
            }
        }, [fetchAiRecommendedVideos, isEditing]);

        // 이미지 클릭 핸들러 (상세 패널에서 이미지 클릭 시)
        const handleImageClick = () => {
            if (!isEditing && onImageSelect) {
                onImageSelect(image);
            }
        };

        // 영상 클릭 핸들러 (시청 기록 관리)
        const handleVideoClick = (video: VideoData) => {
            // 로컬 스토리지에서 현재 시청 기록 가져오기
            const currentHistory = localStorage.getItem('watchHistory');
            const history = currentHistory ? JSON.parse(currentHistory) : [];
            // 이미 있는 영상인지 확인
            const isExist = history.some((item: any) => item.embedId === video.embedId);
            if (!isExist) {
                // 새로운 시청 기록 추가
                const newHistory = [
                    {
                        title: video.title,
                        embedId: video.embedId,
                        timestamp: Date.now()
                    },
                    ...history
                ];
                // 로컬 스토리지에 저장
                localStorage.setItem('watchHistory', JSON.stringify(newHistory));
            }
        };

        // 프로필 방문 핸들러
        const handleVisitProfile = () => {
            if (image.desired_self_profile) {
                router.push(`/others_profile/${image.desired_self_profile}`);
            }
        };

        return (
        <div 
            className="fixed top-0 right-0 w-[500px] h-[calc(100vh-100px)] bg-white shadow-xl overflow-hidden transition-all duration-300 z-10000"
            style={{ 
                zIndex:1000,
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                top: '16px',
                right: '-80px',
                borderRadius: '10px'

            }}
        >
            {/* 상단 썸네일 이미지 + 제목/닫기버튼 오버레이 */}
            <div className="relative w-full h-[150px] sm:h-[220px] flex-shrink-0">
                <img
                    src={image.src}
                    alt={image.main_keyword}
                    className="w-full h-full object-cover rounded-b-none rounded-t-2xl"
                    onClick={handleImageClick}
                />
                 
                {/* 제목 + 닫기버튼 오버레이 */}
                <div className="absolute left-0 top-0 w-full h-full flex flex-col items-start justify-start px-4 pt-4 z-30">
                    <div className="flex items-center w-full justify-between">
                        <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg rounded-xl px-3 py-1 truncate">#{image.main_keyword}</h2>
                        <div className="flex items-center gap-2">
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setShowDetails(false)}
                                className="bg-black/40 hover:bg-black/60 text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
                {/* 카테고리 뱃지: 이미지 좌측 하단 */}
                <span className="absolute left-4 bottom-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-medium z-30">
                    {image.category}
                </span>
                {/* 관심도 뱃지: 이미지 우측 하단 */}
                <span className={`absolute right-4 bottom-4 px-3 py-1 rounded-full text-xs font-bold z-30
                    ${image.sizeWeight >= 1.2 ? 'bg-red-500 text-white' : image.sizeWeight >= 0.8 ? 'bg-yellow-400 text-gray-900' : 'bg-blue-400 text-white'}`}
                >
                    {image.sizeWeight >= 1.2 ? '강' : image.sizeWeight >= 0.8 ? '중' : '약'}
                </span>
                {/* 하단 그라데이션 오버레이로 텍스트 가독성 향상 */}
                <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
            </div>
            {/* 나머지 내용 */}
            <div className="h-[calc(100%-210px)] overflow-y-auto px-6 sm:px-10">
                <div className="flex flex-col w-full mx-auto pb-14 pt-6">
                    {/* 클러스터 Description*/}
                    <p className="text-xs sm:text-[12px] font-bold text-purple-900">{image.mood_keyword}</p>
                    <p className="text-[12px] pt-2 text-gray-700">{image.description}</p>
                    
                    {/* 썸네일 이미지 섹션 */}
                    <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    
                    {/* keywords list 섹션 */}
                    <div>
                        
                        <div className="flex flex-wrap gap-2">
                        {image.keywords.map((keyword: string, idx: number) => (
                            <span
                            key={idx}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                            #{keyword}
                            </span>
                        ))}
                        </div>
                    </div>
                    
                    {/* 영상 탭 섹션 */}
                    <div className="space-y-6 pb-1 pt-4">
                        {!image.desired_self ? (
                        //나의 클러스터 분석일때
                        <Tabs defaultValue="history" className="w-full">
                            <div className="bg-gray-70/70 rounded-lg ">
                                {/* 탭 제목 */}
                                <TabsList className="w-full grid grid-cols-2 py-0 ">
                                    <TabsTrigger value="history" className="text-[12px] py-1">Where this image from</TabsTrigger>
                                    <TabsTrigger value="AI" className="text-[12px] py-1">The way Algorithm see you</TabsTrigger>
                                </TabsList>
                                <br/> <br/>
                                {/* Where this image from 탭 */}
                                <TabsContent value="history" className="px-4 pb-4">
                                    <div className="grid gap-6">
                                    {image.relatedVideos.map((video: VideoData, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                        <h5 className="text-sm font-medium text-gray-800 mb-1">{video.title}</h5>
                                        <div 
                                            className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                            onClick={() => handleVideoClick(video)}
                                        >
                                            <iframe
                                            id={`player-${video.embedId}`}
                                            className="absolute inset-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            />
                                            <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                            watchedVideos.includes(video.embedId) 
                                                ? "bg-green-500/80 text-white" 
                                                : "bg-gray-900/80 text-gray-200"
                                            }`}>
                                            <CheckCircle2 className={`h-3 w-3 ${
                                                watchedVideos.includes(video.embedId)
                                                ? "text-white"
                                                : "text-gray-400"
                                            }`} />
                                            <span className="text-xs font-medium">
                                                {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                                            </span>
                                            </div>
                                        </div>
                                        </div>
                                    ))}
                                    </div>
                                </TabsContent>
                                {/* The way Algorithm see you 탭 */}
                                <TabsContent value="AI" className="px-4 pb-4">
                                    <div className="grid gap-6">
                                    {isLoadingAiVideos ? (
                                        <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : aiRecommendedVideos.length > 0 ? (
                                        aiRecommendedVideos.map((video: VideoData, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <h5 className="text-sm font-medium text-gray-800 mb-1">
                                            <span className="text-blue-500 font-semibold">AI 추천:</span> {video.title}
                                            </h5>
                                            <div 
                                            className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                            onClick={() => handleVideoClick(video)}
                                            >
                                            <iframe
                                                id={`player-ai-${video.embedId}`}
                                                className="absolute inset-0 w-full h-full"
                                                src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                            <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                                watchedVideos.includes(video.embedId) 
                                                ? "bg-green-500/80 text-white" 
                                                : "bg-gray-900/80 text-gray-200"
                                            }`}>
                                                <CheckCircle2 className={`h-3 w-3 ${
                                                watchedVideos.includes(video.embedId)
                                                    ? "text-white"
                                                    : "text-gray-400"
                                                }`} />
                                                <span className="text-xs font-medium">
                                                {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                                                </span>
                                            </div>
                                            </div>
                                        </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                        <p className="text-sm text-gray-500">
                                            '{image.main_keyword}' 키워드에 대한 AI 추천 영상을 가져올 수 없습니다.
                                        </p>
                                        <button
                                            onClick={fetchAiRecommendedVideos}
                                            className="mt-3 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            다시 시도
                                        </button>
                                        </div>
                                    )}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                        ) : (
                        //Desired_self 탭
                        <div className="space-y-6">
                            {/* 프로필 보기 버튼 */}
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

                            {/* 추천 영상 섹션 */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold mb-4 text-gray-800">관련된 추천 영상</h3>
                                <div className="grid gap-4">
                                    {image.relatedVideos.map((video: VideoData, idx: number) => (
                                    <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                                        <div className="relative pt-[56.25%]">
                                        <iframe
                                            className="absolute inset-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${video.embedId}`}
                                            title={video.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                        </div>
                                        <div className="p-3">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</h4>
                                        <div className="mt-1 flex items-center gap-2">
                                            {watchedVideos.includes(video.embedId) ? (
                                            <span className="inline-flex items-center text-green-600 text-xs">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                시청 완료
                                            </span>
                                            ) : (
                                            <span className="text-gray-500 text-xs">아직 시청하지 않음</span>
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClusterDetailPanel; 