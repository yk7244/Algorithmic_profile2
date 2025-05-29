import React from "react";

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
        <div className="w-full flex flex-col items-center justify-center mt-8">
            {/* 슬라이더 선과 점 */}
            <div className="relative w-[400px] h-4 flex items-center">
                {/* 선 */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-300 -translate-y-1/2" />
                {/* 점들 */}
                <div className="relative w-full flex justify-center gap-x-8 items-center z-10">
                    {histories.map((history, index) => (
                        <div key={index} className="relative group flex flex-col items-center">
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-gray-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                {new Date(history.timestamp).toLocaleDateString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            <button
                                className="w-4 h-4 rounded-full bg-black transition-all"
                                onClick={() => handleHistoryClick(index)}
                            />
                            
                        </div>
                    ))}
                </div>
            </div>
            {/* 재생하기 텍스트 */}
            <button
                className="mt-2 text-gray-500 text-base font-normal hover:underline"
                onClick={handlePlayHistory}
                disabled={isPlaying}
            >
                재생하기
            </button>
        </div>
    );
};

export default HistorySlider; 