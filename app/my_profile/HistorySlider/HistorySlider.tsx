import React from "react";
import { getLatestProfileData } from "@/app/utils/get/getProfileData";

interface HistorySliderProps {
    histories: any[];
    currentHistoryIndex: number;
    isPlaying: boolean;
    handlePlayHistory: () => void;
    handleHistoryClick: (index: number) => void;
    handleProfileImagesClick?: () => void;
    changeProfile: (nickname: string, description: string) => void;
}

const HistorySlider: React.FC<HistorySliderProps> = ({
    histories,
    currentHistoryIndex,
    isPlaying,
    handlePlayHistory,
    handleHistoryClick,
    handleProfileImagesClick,
    changeProfile,
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
        <div className="relative z-1 max-w-[680px] flex flex-col items-center mx-auto pb-10 ">
            
        <div className="relative bg-white/20 backdrop-blur-lg shadow-lg rounded-full w-full h-16 flex items-center justify-center px-10">
            {/* 슬라이더 선과 점 */}
            <div className="relative w-full h-12 flex items-center ">
                {/* 왼쪽: 화살표 + 텍스트 (선 바로 바깥) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center select-none z-10 "
                style={{
                    left: `${100 / (histories.length + 3) -17}%`,
                }}>
                    <span className="text-sm font-semibold text-gray-500 ml-1 ">과거 자화상</span>
                    <svg display="block" width="20" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {/* 오른쪽: 화살표 + 텍스트 (선 바로 바깥) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center select-none z-10"
                style={{
                    right: `${100 / (histories.length + 3) -17}%`,
                }}>
                    <svg display="block" width="20" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-sm font-semibold text-gray-500 mr-1">현재 자화상</span>
                </div>
                {/* 선 */}
                <div
                    className="absolute top-1/2 h-[1.5px] bg-gray-600 -translate-y-1/2 opacity-50 rounded-full"
                    style={{
                        left: `${100 / (histories.length + 3) -4}%`,
                        right: `${100 / (histories.length + 3) -4}%`,
                    }}
                />
                {/* 점들: 선의 시작~끝(offset~100-offset%) 안에서만 등간격 배치 */}
                {(() => {
                    const totalDots = histories.length + 1; // 히스토리 개수 + 1 (파란 점)
                    const offset = 100 / (totalDots + 1);
                    const span = 100 - 2 * offset;
                    return [
                        ...histories.map((history, index) => {
                            const hasDesiredSelf = history.images && history.images.some((img: any) => img.desired_self === true);
                            const isSelected = currentHistoryIndex === index;
                            // 점 위치: 선의 시작~끝(offset~100-offset%) 안에서 등간격
                            const leftPercent = totalDots > 1
                                ? offset + (index / (totalDots - 1)) * span
                                : 50;
                            return (
                                <div
                                    key={index}
                                    className="absolute flex flex-col items-center group"
                                    style={{ left: `${leftPercent}%`, transform: 'translate(-50%, -50%)', top: '50%' }}
                                >
                                    <button
                                        className="w-4 h-4 rounded-full transition-all opacity-80 flex items-center justify-center"
                                        onClick={() => {
                                            handleHistoryClick(index);
                                            changeProfile(history.nickname, history.description);
                                            if (index === -1) {
                                                const tmp = getLatestProfileData();
                                                changeProfile(tmp.nickname, tmp.description);
                                            }
                                        }}
                                    >
                                        {hasDesiredSelf ? (
                                            <svg width="16" height="16" viewBox="0 0 19 19" fill="none">
                                                <path d="M0 0L9.32795 3.45455L19 0L15.5455 9.5L19 19L9.32795 16.4091L0 19L3.71431 9.5L0 0Z" fill={isSelected ? "#3B82F6" : "#000000"} />
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
                        }),
                        // 파란 점: 항상 오른쪽 끝 (offset 만큼 떨어진 위치)
                        (() => {
                            const rightPercent = 100 - offset;
                            return (
                                <div
                                    key="profile-dot"
                                    className="absolute flex flex-col items-center group"
                                    style={{ left: `${rightPercent}%`, transform: 'translate(-50%, -50%)', top: '50%' }}
                                >
                                    <button
                                        className="w-4 h-4 rounded-full bg-blue-500 transition-all opacity-80 hover:opacity-100"
                                        onClick={() => {
                                            if (handleProfileImagesClick) handleProfileImagesClick();
                                            handleHistoryClick(-1);
                                        }}
                                    />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-gray-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                        꾸민 Profile Images
                                    </span>
                                </div>
                            );
                        })()
                    ];
                })()}
            </div>
        </div>
        {/* 재생 버튼 */}
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