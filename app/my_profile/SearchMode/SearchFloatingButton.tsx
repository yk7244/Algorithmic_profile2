import React from "react";
import StarIcon from '@/public/images/Star.svg';
import search_star from "@/public/images/search_star.png";


interface SearchFloatingButtonProps {
    isSearchMode: boolean;
    toggleSearchMode: () => void;
}

const SearchFloatingButton: React.FC<SearchFloatingButtonProps> = ({
    isSearchMode,
    toggleSearchMode,
}) => (
    <div className="fixed bottom-20 right-20 z-50 flex flex-col items-center group">
        {/* 말풍선 */}
        <div className="mb-2 px-5 py-2 bg-white rounded-xl shadow-lg text-gray-700 text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            당신의 관심사로, 새로운 연결을 탐색해보세요.
        </div>
        {/* 별 모양 버튼 */}
        <button
            onClick={toggleSearchMode}
            className="relative w-20 h-20 flex items-center justify-center  focus:outline-none group"
            aria-label={isSearchMode ? '검색 모드 종료' : '검색하기'}
            style={{ background: 'none' }}
        >
            <img src={search_star.src} alt="search" className="w-20 h-20" />
        </button>
    </div>
);

export default SearchFloatingButton; 