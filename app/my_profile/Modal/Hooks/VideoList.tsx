import React from 'react';
import { VideoData } from '../../Draggable/DraggableImage';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoListProps {
    videos: VideoData[];
    watchedVideos: string[];
    onVideoClick: (video: VideoData) => void;
    isLoading?: boolean;
    titlePrefix?: string;
    onRetry?: () => void;
    emptyMessage?: string;
    isError?: boolean;
    // 추가
    isAiRecommended?: boolean;
    nextPageToken?: string;
    fetchAndSetVideos?: (isLoadMore?: boolean) => void;
}

const VideoList: React.FC<VideoListProps> = ({
    videos,
    watchedVideos,
    onVideoClick,
    isLoading,
    titlePrefix,
    onRetry,
    emptyMessage = "영상을 찾을 수 없습니다.",
    isError,
    // 추가
    isAiRecommended = false,
    nextPageToken,
    fetchAndSetVideos
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (isError || !videos || videos.length === 0 || (videos.length === 1 && videos[0].embedId === '')) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                    {emptyMessage}
                </p>
                {onRetry && (
                     <button
                        onClick={onRetry}
                        className="mt-3 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                    >
                        다시 시도
                    </button>
                )}
            </div>
        );
    }
    
    return (
        <div className="flex gap-4 overflow-x-auto items-center">
            {videos.map((video, idx) => (
                <div key={`${video.embedId}-${idx}`} className="space-y-2 min-w-[220px]">
                    <a
                        href={`https://www.youtube.com/watch?v=${video.embedId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer aspect-video block"
                        onClick={() => onVideoClick(video)}
                    >
                        <img
                            src={`https://img.youtube.com/vi/${video.embedId}/hqdefault.jpg`}
                            alt={video.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* 시청 여부 표시 */}
                        {/*
                        <div className={`absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full backdrop-blur-sm transition-all duration-300 ${watchedVideos.includes(video.embedId) ? "bg-green-500/80 text-white" : "bg-gray-900/80 text-gray-200"}`}>
                            <CheckCircle2 className={`h-2.5 w-2.5 ${watchedVideos.includes(video.embedId) ? "text-white" : "text-gray-400"}`} />
                            <span className="text-xs font-medium">
                                {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                            </span>
                        </div>
                        */}
                    </a>
                    <h5 className="text-xs font-medium text-gray-800 truncate leading-tight">
                        {titlePrefix && <span className="text-blue-500 font-semibold">{titlePrefix}</span>}
                        {video.title}
                    </h5>
                </div>
            ))}
            {/* AI 추천 영상일 때만 더보기 버튼 */}
            {isAiRecommended && nextPageToken && (
                <div className="flex items-center min-w-[120px]">
                    <Button
                        onClick={() => fetchAndSetVideos && fetchAndSetVideos(true)} 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transition-all duration-300"
                    >
                        더보기
                    </Button>
                </div>
            )}
        </div>
    );
};

export default VideoList; 