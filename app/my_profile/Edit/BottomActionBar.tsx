import React from "react";
import { Button } from "@/components/ui/button";
import { Pen, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import SearchFloatingButton from "@/app/search/SearchMode/SearchFloatingButton";

interface BottomActionBarProps {
    isEditing: boolean;
    isGeneratingProfile: boolean;
    onEditClick: () => void;
    onSaveClick: () => void;
    onGenerateProfile: () => void;
    sliderCurrentHistoryIndex: number;
    isSearchMode: boolean;
    toggleSearchMode: () => void;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
    isEditing,
    isGeneratingProfile,
    onEditClick,
    onSaveClick,
    sliderCurrentHistoryIndex,
    isSearchMode,
    toggleSearchMode,
}) => {
    if (sliderCurrentHistoryIndex !== -1) {
        return null;
    }

    return (
        <>
            {/* 수정하기/저장 버튼 */}
            {!isEditing ? (
            <div className="fixed right-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-50 bg-white/70 
            backdrop-blur-lg rounded-full py-6 px-2 shadow-xl transition-all duration-10000">
                <div className="relative group">
                <button
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md transition-all"
                    onClick={onEditClick}
                >
                    <Pen className="w-5 h-5 text-black" />
                </button>
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]">
                    무드보드 이미지나 위치가 이상한가요? 직접 조정해보세요
                </div>
                </div>
                {/* 업로드 버튼 */}
                <div className="relative group">
                <Link href="/upload/page_user">
                    <button
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md transition-all"
                    >
                    <RefreshCw className="w-5 h-5 text-black" />
                    </button>
                </Link>
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]">
                새로운 알고리즘 분석을 원하시나요? 시청기록을 업로드해 업데이트해보세요
                </div>
                </div>
                {/* 검색 버튼(파란 glow) */}
                <div className="relative group">
                <button
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md ring-4 ring-blue-300 ring-offset-2 transition-all"
                    onClick={toggleSearchMode}
                    aria-label={isSearchMode ? '검색 모드 종료' : '검색하기'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </button>
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]">
                    나의 알고리즘으로 다른 알고리즘 프로필을 탐색해보세요.
                </div>
                </div>
            </div>
                
            ) : (
                <div className="fixed bottom-20 right-20 flex flex-col gap-3 z-50 transition-all duration-300">

                    <button
                    className={`h-12 px-8 border border-gray-200 flex items-center gap-2 rounded-full shadow-md bg-black text-white hover:text-gray-200 hover:bg-gray-600`}                    
                    onClick={ onSaveClick}
                    >
                    <Save className="w-5 h-5 text-white" />

                    저장하기
                    </button>
                    

                </div>
            )}
        </>

    );
};

export default BottomActionBar; 