import React from 'react';
import { VideoData } from '../../DraggableImage';
import { CheckCircle2 } from 'lucide-react';

interface VideoListProps {
    videos: VideoData[];
    watchedVideos: string[];
    onVideoClick: (video: VideoData) => void;
    isLoading?: boolean;
    titlePrefix?: string;
    onRetry?: () => void;
    emptyMessage?: string;
    isError?: boolean;
}

const VideoList: React.FC<VideoListProps> = ({
    videos,
    watchedVideos,
    onVideoClick,
    isLoading,
    titlePrefix,
    onRetry,
    emptyMessage = "영상을 찾을 수 없습니다.",
    isError
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
        <div className="grid gap-6">
            {videos.map((video, idx) => (
                <div key={`${video.embedId}-${idx}`} className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-800 mb-1 truncate">
                        {titlePrefix && <span className="text-blue-500 font-semibold">{titlePrefix}</span>}
                        {video.title}
                    </h5>
                    <div
                        className="relative w-full max-h-[100px] max-w-[450px] pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => onVideoClick(video)}
                    >
                        <iframe
                            id={`player-${video.embedId}-${idx}`}
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title}
                        />
                        <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${watchedVideos.includes(video.embedId) ? "bg-green-500/80 text-white" : "bg-gray-900/80 text-gray-200"}`}>
                            <CheckCircle2 className={`h-3 w-3 ${watchedVideos.includes(video.embedId) ? "text-white" : "text-gray-400"}`} />
                            <span className="text-xs font-medium">
                                {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VideoList; 