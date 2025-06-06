import React, { useState, useRef, useEffect } from "react";
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
    const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
    const [showNotification, setShowNotification] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const DRAG_THRESHOLD = 5; // 5px 이상 움직여야 드래그로 인식

    // 클라이언트에서만 window 크기 설정
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            
            const handleResize = () => {
                setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            };
            
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // 초기 마우스 위치 저장
        setInitialMousePos({ x: e.clientX, y: e.clientY });
        
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            setDragStart({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (typeof window === 'undefined') return;

        // 드래그 거리 계산
        const dragDistance = Math.sqrt(
            Math.pow(e.clientX - initialMousePos.x, 2) + 
            Math.pow(e.clientY - initialMousePos.y, 2)
        );

        // 임계값을 넘으면 드래그 모드로 전환
        if (dragDistance > DRAG_THRESHOLD && !isDragging) {
            setIsDragging(true);
        }

        // 드래그 중일 때만 위치 업데이트
        if (isDragging) {
        const newX = window.innerWidth - (e.clientX - dragStart.x) - 80; // 80은 버튼 크기
        const newY = window.innerHeight - (e.clientY - dragStart.y) - 80;

        // 화면 경계 제한
        const clampedX = Math.max(20, Math.min(newX, window.innerWidth - 100));
        const clampedY = Math.max(20, Math.min(newY, window.innerHeight - 100));

        setPosition({ x: clampedX, y: clampedY });
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        // 드래그하지 않았다면 클릭으로 처리
        if (!isDragging) {
            toggleSearchMode();
        }
        setIsDragging(false);
        setInitialMousePos({ x: 0, y: 0 }); // 리셋
    };

    // 마우스 이벤트 리스너 등록/해제
    React.useEffect(() => {
        const handleMouseMoveGlobal = (e: MouseEvent) => handleMouseMove(e);
        const handleMouseUpGlobal = (e: MouseEvent) => handleMouseUp(e);

        // mousedown 후에는 항상 리스너 등록 (드래그 감지를 위해)
        if (initialMousePos.x !== 0 || initialMousePos.y !== 0) {
            document.addEventListener('mousemove', handleMouseMoveGlobal);
            document.addEventListener('mouseup', handleMouseUpGlobal);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMoveGlobal);
                document.removeEventListener('mouseup', handleMouseUpGlobal);
            };
        }
    }, [initialMousePos, isDragging, dragStart]);

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

    // 툴팁 위치 계산 함수
    const getTooltipAlignment = () => {
        if (windowSize.width === 0) return 'left-1/2 transform -translate-x-1/2'; // 기본값
        
        if (position.x < windowSize.width / 3) return 'right-0';
        if (position.x < windowSize.width * 2 / 3) return 'left-1/2 transform -translate-x-1/2';
        return 'left-0';
    };

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
                    transition-opacity pointer-events-none ${getTooltipAlignment()}`}
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