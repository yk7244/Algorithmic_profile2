import React from "react";

interface HistorySliderProps {
    histories: any[];
    currentHistoryIndex: number;
    isPlaying: boolean;
    handlePlayHistory: () => void;
    handleHistoryClick: (index: number) => void;
    handleProfileImagesClick?: () => void;
    isTransitioning?: boolean;
}

const HistorySlider: React.FC<HistorySliderProps> = ({
    histories,
    currentHistoryIndex,
    isPlaying,
    handlePlayHistory,
    handleHistoryClick,
    handleProfileImagesClick,
    isTransitioning = false,
}) => {
    //console.log('[HistorySlider] Received histories prop:', histories, 'Length:', histories.length);
    if (histories.length === 0 && currentHistoryIndex === -1) {
        // 히스토리가 없고, 현재 선택된 것도 없다면 (즉, 초기 상태이거나 아무것도 저장되지 않은 상태)
        // 파란 점만 표시하거나, 아무것도 표시 안 할 수 있습니다.
        // 현재 로직에서는 파란 점은 항상 표시되므로, 여기서는 histories가 비었을 때 null을 반환하지 않도록 수정합니다.
        // 만약 정말 아무것도 표시하고 싶지 않다면, 아래 if문을 유지합니다.
        // if (histories.length === 0) return null; -> 이 줄을 주석 처리하거나 삭제하여 파란 점은 항상 보이도록 함
    }
    
    return (
        <div className="w-[400px] flex flex-col items-center mx-auto mt-1 mb-40">
            {/* 슬라이더 선과 점 */}
            <div className="relative w-full h-4 flex items-center">
                {/* 선 */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300 -translate-y-1/2 opacity-50 rounded-full" />
                {/* 점들 */}
                <div className="relative w-full flex justify-center gap-x-8 items-center z-10 ">
                    
                    
                    {/* 기존 히스토리 점들 */}
                    {histories.map((history, index) => {
                        // desired_self가 true인 이미지가 포함된 히스토리인지 확인
                        const hasDesiredSelf = history.images && history.images.some((img: any) => img.desired_self === true);
                        // 현재 선택된 히스토리인지 확인
                        const isSelected = currentHistoryIndex === index;
                        
                        return (
                            <div key={index} className="relative group flex flex-col items-center">
                                <button
                                    className={`w-4 h-4 rounded-full transition-all opacity-80 flex items-center justify-center
                                        ${isTransitioning ? 'cursor-not-allowed opacity-50' : 'hover:opacity-100'}`}
                                    onClick={() => {
                                        if (isTransitioning) return; // 🆕 전환 중이면 클릭 무시
                                        handleHistoryClick(index);
                                        console.log(history);
                                    }}
                                    disabled={isTransitioning} // 🆕 전환 중 비활성화
                                >
                                    {hasDesiredSelf ? (
                                        <svg width="16" height="16" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 0L9.32795 3.45455L19 0L15.5455 9.5L19 19L9.32795 16.4091L0 19L3.71431 9.5L0 0Z" fill={isSelected ? "#3B82F6" : "#000000"}/>
                                        </svg>
                                    ) : (
                                        <div className={`w-4 h-4 rounded-full transition-colors ${isSelected ? 'bg-blue-500' : 'bg-black'}`} />
                                    )}
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-gray-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    {new Date(history.timestamp).toLocaleDateString('ko-KR', {
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        );
                    })}
                    {/* 원본 ProfileImages 점 */}
                    <div className="relative group flex flex-col items-center">
                        <button
                            className={`w-4 h-4 rounded-full bg-black transition-all opacity-80 
                                ${isTransitioning ? 'cursor-not-allowed opacity-50' : 'hover:opacity-100'}`}
                            onClick={() => {
                                if (isTransitioning) return; // 🆕 전환 중이면 클릭 무시
                                console.log('🔵 파란색 점 클릭 - ProfileImages 로드');
                                if (handleProfileImagesClick) {
                                    handleProfileImagesClick();
                                }
                                // 히스토리 상태를 원본으로 리셋
                                handleHistoryClick(-1); // -1은 원본 상태를 의미
                            }}
                            disabled={isTransitioning} // 🆕 전환 중 비활성화
                        />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-gray-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            꾸민 Profile Images
                        </span>
                    </div>
                </div>
            </div>
            {/* 재생하기 텍스트 */}
            <button
                className={`mt-2 text-base font-normal transition-all
                    ${isPlaying || isTransitioning 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-500 hover:underline hover:text-gray-700'}`}
                onClick={handlePlayHistory}
                disabled={isPlaying || isTransitioning}
            >
                {isPlaying ? '재생 중...' : isTransitioning ? '전환 중...' : '재생하기'}
            </button>
        </div>
    );
};

export default HistorySlider; 