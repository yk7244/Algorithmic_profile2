import React, { useEffect, useState } from "react";
import { getLatestProfileData } from "@/app/utils/get/getProfileData";

// 안전한 날짜 포맷팅 함수
const formatSafeDate = (dateValue: any): string => {
    if (!dateValue) return '날짜를 불러오는 중...';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return '날짜 정보 없음';
    }
    
    return date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

interface HistorySliderProps {
    originalImage: any[];
    histories: any[];
    currentHistoryIndex: number;
    isPlaying: boolean;
    handlePlayHistory: () => void;
    handleHistoryClick: (index: number) => void;
    handleProfileImagesClick?: () => void;
    changeProfile: (nickname: string, description: string) => void;
}

const HistorySlider: React.FC<HistorySliderProps> = ({
    originalImage,
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
    
    // 안내 메시지 토스트 상태
    const [showToast, setShowToast] = useState(false);
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);
    
    return (
    <div className="relative z-1 flex flex-col items-center mx-auto pb-10 ">
            {/* 3초간 보여주는 안내 메시지 */}
            {showToast && (
                <div className="relative flex items-center justify-center mt-4 bg-black/80 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fadeIn text-base mb-5">
                    {currentHistoryIndex === -1 ? '현재 시각화' : formatSafeDate(histories[currentHistoryIndex]?.created_at || histories[currentHistoryIndex]?.timestamp)} 모습이예요.
                </div>
            )}
        <div className="relative bg-white/50 backdrop-blur-lg w-full flex flex-col items-center">
            <div className="relative rounded-full w-full h-18 flex items-center justify-center px-10 mb-10 max-w-[680px]">
                {/* 슬라이더 선과 점 */}
                <div className="relative w-full h-16 flex flex-col items-center ">
                    {/* 왼쪽: 화살표 + 텍스트 (선 바로 바깥) */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center select-none z-10 "
                    style={{
                        left: `${100 / (histories.length + 3) -17}%`,
                    }}>
                        <span className="text-sm font-semibold text-gray-500 ml-1 ">과거 시각화</span>
                        <svg display="block" width="20" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {/* 오른쪽: 화살표 + 텍스트 (선 바로 바깥) */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center select-none z-10"
                    style={{
                        right: `${100 / (histories.length + 3) -17}%`,
                    }}>
                        <svg display="block" width="20" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-sm font-semibold text-gray-500 mr-1">현재 시각화</span>
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
                                
                                // 🔍 디버깅: desired_self 감지 로그
                                if (hasDesiredSelf) {
                                    console.log(`⭐ 히스토리 ${index}: desired_self 감지됨 (별모양 표시)`, {
                                        historyImages: history.images?.length || 0,
                                        desiredSelfCount: history.images?.filter((img: any) => img.desired_self === true).length || 0
                                    });
                                }
                                // 점 위치: 왼쪽이 과거(index 큰 값), 오른쪽이 현재(index 작은 값)
                                const reversedIndex = histories.length - 1 - index; // 순서 반전
                                const leftPercent = totalDots > 1
                                    ? offset + (reversedIndex / (totalDots - 1)) * span
                                    : 50;
                                return (
                                    <div
                                        key={index}
                                        className="absolute flex flex-col items-center group"
                                        style={{ left: `${leftPercent}%`, transform: 'translate(-50%, -50%)', top: '50%' }}
                                    >
                                        <button
                                            className="w-4 h-4 rounded-full transition-all opacity-80 flex items-center justify-center"
                                            onClick={async () => {
                                                handleHistoryClick(index);
                                                changeProfile(history.nickname, history.description);
                                                setShowToast(true);
                                                if (index === -1) {
                                                    try {
                                                        const tmp = await getLatestProfileData();
                                                        if (tmp) {
                                                            changeProfile(tmp.nickname, tmp.main_description);
                                                        }
                                                    } catch (error) {
                                                        console.error('❌ 최신 프로필 데이터 로드 오류:', error);
                                                    }
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
                                            {formatSafeDate(history.timestamp || history.created_at)}
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
                                            className="w-4 h-4 rounded-full bg-blue-800 transition-all opacity-80 hover:opacity-100"
                                            onClick={() => {
                                                if (handleProfileImagesClick) handleProfileImagesClick();
                                                handleHistoryClick(-1);
                                                setShowToast(true);
                                            }}
                                        />
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-gray-500 px-1 py-[-1px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            꾸민 Profile Images
                                        </span>
                                    </div>
                                );
                            })()
                        ];

                    })()}
                    {/* 재생 버튼 
                    <div className="flex justify-center items-center w-full " >
                        <button
                            className="relative items-center flex mt-2 text-gray-500 text-sm bg-white/50 backdrop-blur-lg rounded-full px-4 py-2 shadow-lg font-normal hover:underline"
                            onClick={handlePlayHistory}
                            disabled={isPlaying}
                        >
                            연속으로 재생하기
                        </button>
                    </div>
                    */}
                    
                </div>
                
            </div>
        </div>
        
    </div>  
    );
};

export default HistorySlider; 