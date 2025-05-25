import React from "react";
import { Button } from "@/components/ui/button";

interface HistorySliderProps {
    histories: any[];
    currentHistoryIndex: number;
    isPlaying: boolean;
    handlePlayHistory: () => void;
    handleHistoryClick: (index: number) => void;
}

const HistorySlider: React.FC<HistorySliderProps> = ({
    histories,
    currentHistoryIndex,
    isPlaying,
    handlePlayHistory,
    handleHistoryClick,
}) => {
    if (histories.length === 0) return null;
    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[60%] max-w-[500px] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-semibold">무드보드 히스토리</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {currentHistoryIndex === 0 ? "처음 히스토리" :
                currentHistoryIndex === histories.length - 1 ? "마지막 히스토리" :
                    new Date(histories[currentHistoryIndex].timestamp).toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                    })}
            </p>
            </div>
            <Button
            variant="outline"
            size="sm"
            onClick={handlePlayHistory}
            disabled={isPlaying}
            className="flex items-center gap-2 text-xs sm:text-sm"
            >
            {isPlaying ? (
                <span className="animate-pulse">재생중...</span>
            ) : (
                <span>히스토리 재생</span>
            )}
            </Button>
        </div>

        {/* 타임라인 슬라이더 */}
        <div className="relative w-full h-1 sm:h-1 bg-gray-100 rounded-full">
            <div
            className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-200 -translate-y-1/2"
            style={{
                width: `${(currentHistoryIndex / (histories.length - 1)) * 100}%`
            }}
            />
            <div className="absolute top-0 left-0 w-full flex items-center justify-between px-1">
            {histories.map((history, index) => (
                <button
                key={history.timestamp}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all -mt-0.5 sm:-mt-1 relative group ${
                    currentHistoryIndex === index
                    ? 'bg-blue-500 scale-125'
                    : index < currentHistoryIndex
                        ? 'bg-blue-200'
                        : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => handleHistoryClick(index)}
                >
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap text-[10px] sm:text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {index === 0 ? "처음 히스토리" :
                    index === histories.length - 1 ? "마지막 히스토리" :
                        new Date(history.timestamp).toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                        })}
                </span>
                </button>
            ))}
            </div>
        </div>
        </div>
    );
};

export default HistorySlider; 