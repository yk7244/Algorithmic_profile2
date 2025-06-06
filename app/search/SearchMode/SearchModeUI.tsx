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
        <div className="absolute inset-0 overflow-hidden -z-10 bg-[#333947]">
            <div className="absolute -top-[40%] -left-[10%] w-[90%] h-[60%] rounded-full bg-[#B3D4FF] blur-[120px] animate-blob" />
            {/*<div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[60%] rounded-full bg-[#6B7F99] blur-[120px] animate-blob animation-delay-20" />*/}
            <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-[#6179A7] blur-[120px] animate-blob animation-delay-200" />
        </div>
        
        {/* 뒤로가기 버튼 - 배경과 분리하여 더 높은 z-index */}
        <button 
            onClick={() => {
                toggleSearchMode();
                console.log('검색 모드 종료');
            }}
            className="mt-20 fixed top-8 left-8 z-50 p-3 hover:bg-white/30 transition-all duration-300 group"
            aria-label="검색 모드 종료"
        >
            <svg 
                className="w-10 h-10 text-white font-bold group-hover:scale-110 hover:rounded-full transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        {/* 선택된 이미지의 main_keyword 표시 (중앙) - 짧은 애니메이션 후 사라짐 */}
        {selectedImage && (
            <div 
            className="fixed mt-100 inset-0 flex items-center justify-center z-20 pointer-events-none animate-fadeOutWithDelay"
            style={{animationDelay: '1.5s'}} // 1.5초 동안 표시된 후 사라짐
            >
            <div className="relative">
                <h1 className="text-[50px] font-bold text-white opacity-10 animate-scaleUp">
                {selectedImage.main_keyword.toUpperCase()}
                </h1>
            </div>
        </div>
        )}
        {/* 검색 모드일 때 표시되는 제목 -> 화면 가운데에 아무것도 선택되지 않았을때 표시한다*/}
        <div className="fixed top-28 left-0 right-0 text-center z-40">
            
            <h1 className="text-4xl font-bold text-white drop-shadow-lg animate-fadeIn" style={{animationDelay: '0.1s'}}> 
            당신의 관심사로, 새로운 연결을 탐색해보세요.
            </h1>
            <div className="mt-4 text-white/80 text-lg max-w-2xl mx-auto animate-fadeIn" style={{animationDelay: '0.3s'}}>
            원하시는 관심사를 선택해주세요
            </div>
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