import React from "react";
import { Search } from "lucide-react";

interface SearchFloatingButtonProps {
    isSearchMode: boolean;
    toggleSearchMode: () => void;
}

const SearchFloatingButton: React.FC<SearchFloatingButtonProps> = ({
    isSearchMode,
    toggleSearchMode,
    }) => (
    <div className="fixed top-32 right-8 z-50 group">
        <button
        onClick={toggleSearchMode}
        className={`w-16 h-16 ${
            isSearchMode ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110`}
        aria-label={isSearchMode ? '검색 모드 종료' : '검색하기'}
        >
        <Search className="w-7 h-7" />
        </button>
        <div className="absolute right-0 top-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm">
            {isSearchMode 
            ? '검색 모드를 종료하고 내 프로필로 돌아갑니다' 
            : '나와 비슷한 관심사를 가진 사람의 알고리즘 프로필을 찾아보세요!'}
        </div>
        <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
    </div>
);

export default SearchFloatingButton; 