import React from "react";

interface SearchModeUIProps {
    isSearchMode: boolean;
    selectedImage: any;
    selectedImages: any[];
    handleSearch: () => void;
    toggleSearchMode: () => void;
    setIsSearchMode: (value: boolean) => void;
}

const SearchModeUI: React.FC<SearchModeUIProps> = ({
    isSearchMode,
    selectedImage,
    selectedImages,
    handleSearch,
    toggleSearchMode,
    setIsSearchMode,
    }) => {
    if (!isSearchMode) return null;

    return (
    <>
        {/* 검색 모드일 때 배경 그라데이션 추가 */}
        <div className="absolute inset-0 overflow-hidden -z-10 bg-[#333947] transition-all duration-1000 ease-in-out">
            <div className="absolute -top-[40%] -left-[10%] w-[90%] h-[60%] rounded-full bg-[#B3D4FF] blur-[120px] animate-blob" />
            {/*<div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[60%] rounded-full bg-[#6B7F99] blur-[120px] animate-blob animation-delay-20" />*/}
            <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-[#6179A7] blur-[120px] animate-blob animation-delay-200" />
        </div>

        {/* 키워드 태그들과 검색 버튼을 화면 하단에 고정 */}
        <div className="fixed bottom-14 right-20 z-40 ">
            <div className="flex flex-col items-end gap-6 transition-all duration-500">
                <div className="flex flex-col gap-4 items-end">
                {selectedImages.map((img) => (
                    <div 
                        key={img.id} 
                        className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full  animate-fadeIn"
                        style={{animationDelay: `${selectedImages.indexOf(img) * 0.1}s`}}
                    >
                        <span className="text-md font-bold text-white drop-shadow-md">
                        #{img.main_keyword}
                        </span>
                    </div>
                    ))}
                </div>
                    
                {/* 검색 버튼 - 선택된 이미지가 있을 때만 표시 */}
                <div>
                    <div    
                        className={`transition-all duration-700 ease-in-out ${
                        selectedImages.length > 0 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'
                        }`}
                        style={{transitionDelay: selectedImages.length > 0 ? '0.3s' : '0s'}}
                    >
                        <button
                        onClick={handleSearch}
                        className="bg-white text-black font-bold py-3 px-10 rounded-full border-2 border-white/70 
                        transition-all duration-300 hover:scale-105 shadow-2xl text-xl hover:bg-black hover:text-white"
                        >
                        Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default SearchModeUI; 