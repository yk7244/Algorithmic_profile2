import React, { useState, useRef } from "react";
import StarIcon from '@/public/images/Star.svg';
import search_star from "@/public/images/search_star.png";


interface SearchFloatingButtonProps {
    isSearchMode: boolean;
    toggleSearchMode: () => void;
}

const SearchFloatingButton: React.FC<SearchFloatingButtonProps> = ({
    isSearchMode,
    toggleSearchMode,
}) => {
    const [position, setPosition] = useState({ x: 20, y: 20 }); // right: 20px, bottom: 20px
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showNotification, setShowNotification] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            setDragStart({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const newX = window.innerWidth - (e.clientX - dragStart.x) - 80; // 80은 버튼 크기
        const newY = window.innerHeight - (e.clientY - dragStart.y) - 80;

        // 화면 경계 제한
        const clampedX = Math.max(20, Math.min(newX, window.innerWidth - 100));
        const clampedY = Math.max(20, Math.min(newY, window.innerHeight - 100));

        setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 마우스 이벤트 리스너 등록/해제
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    // 검색 모드 진입 시 상단 알림 표시
    React.useEffect(() => {
        if (isSearchMode) {
            setShowNotification(true);
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [isSearchMode]);

    return (
        <>
            {/* 검색 모드 전환 알림 - 화면 상단 중앙 */}
            {showNotification && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-100 px-6 py-3 bg-black text-white rounded-xl shadow-lg font-medium transition-all duration-300">
                    검색 모드로 전환되었습니다
                </div>
            )}
            
            {/* 플로팅 버튼 */}
            <div 
                className="fixed flex flex-col items-center z-100"
                style={{ 
                    right: `${position.x}px`, 
                    bottom: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {/* 별 모양 버튼 */}
                <button
                    ref={buttonRef}
                    onClick={!isDragging ? toggleSearchMode : undefined}
                    onMouseDown={handleMouseDown}
                    className={`relative w-20 h-20 flex justify-center focus:outline-none group transition-all duration-200 ${
                        isDragging ? 'scale-110 opacity-80' : 'hover:scale-105'
                    }`}
                    aria-label={isSearchMode ? '검색 모드 종료' : '검색하기'}
                    style={{ background: 'none' }}
                >
                    {/* 호버 메시지 - 드래그 중에는 숨김 */}
                    {!isDragging && (
                        <div 
                            className={`absolute bottom-full mb-2 px-5 py-2 bg-white rounded-xl shadow-lg 
                            text-gray-700 text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 
                            transition-opacity pointer-events-none ${
                                // 화면 위치에 따른 정렬
                                position.x < window.innerWidth / 3 ? 'right-0' : 
                                position.x < window.innerWidth * 2 / 3 ? 'left-1/2 transform -translate-x-1/2' : 
                                'left-0'
                            }`}
                        >
                            {isSearchMode ? '검색모드를 종료하시고 싶으시면 한번더 클릭하세요' : '당신의 관심사로, 새로운 연결을 탐색해보세요.'}
                        </div>
                    )}
                    <img src={search_star.src} alt="search" className="w-20 h-20" />
                </button>
            </div>
        </>
    );
};

export default SearchFloatingButton; 