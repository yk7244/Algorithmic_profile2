import React from "react";

interface SearchModeUIProps {
    isSearchMode: boolean;
    selectedImage: any;
    selectedImages: any[];
    handleSearch: () => void;
}

const SearchModeUI: React.FC<SearchModeUIProps> = ({
    isSearchMode,
    selectedImage,
    selectedImages,
    handleSearch,
    }) => {
    if (!isSearchMode) return null;

    return (
    <>
        {/* 검색 모드일 때 배경 그라데이션 추가 */}
        <div className="fixed inset-0 z-10 bg-gradient-to-br from-emerald-900 via-black-900 to-white-800 animate-gradient-x">
            {/* 배경 패턴 효과 */}
            <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            </div>
        </div>

        {/* 선택된 이미지의 main_keyword 표시 (중앙) - 짧은 애니메이션 후 사라짐 */}
        {selectedImage && (
            <div 
            className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none animate-fadeOutWithDelay"
            style={{animationDelay: '1.5s'}} // 1.5초 동안 표시된 후 사라짐
            >
            <div className="relative">
                <h1 className="text-[150px] font-bold text-white opacity-10 animate-scaleUp">
                {selectedImage.main_keyword.toUpperCase()}
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-full animate-pulseOnce">
                    <span className="text-4xl font-bold text-white">
                    {selectedImage.main_keyword}
                    </span>
                </div>
                </div>
            </div>
            </div>
        )}

        {/* 검색 모드일 때 표시되는 제목 */}
        <div className="absolute top-28 left-0 right-0 text-center z-40">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Explore someone's interest based on your interest
            </h1>
            <div className="mt-4 text-white/80 text-lg max-w-2xl mx-auto">
            Discover profiles that match your unique algorithm preferences
            </div>
            
            {/* 선택된 이미지들의 키워드 컨테이너 - 항상 존재하지만 내용물이 변함 */}
            <div className="mt-16 flex flex-col items-center gap-6 min-h-[200px] transition-all duration-500">
            {/* 키워드 태그 - 선택된 이미지가 있을 때만 표시 */}
            <div 
                className={`flex flex-wrap gap-4 justify-center max-w-4xl mx-auto transition-all duration-500 ${
                selectedImages.length > 0 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-10'
                }`}
            >
                {selectedImages.map((img) => (
                <div 
                    key={img.id} 
                    className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 animate-fadeIn"
                    style={{animationDelay: `${selectedImages.indexOf(img) * 0.1}s`}}
                >
                    <span className="text-3xl font-bold text-white drop-shadow-md">
                    #{img.main_keyword}
                    </span>
                </div>
                ))}
            </div>
            
            {/* 검색 버튼 - 선택된 이미지가 있을 때만 표시 */}
            <div 
                className={`transition-all duration-700 ease-in-out ${
                selectedImages.length > 0 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'
                }`}
                style={{transitionDelay: selectedImages.length > 0 ? '0.3s' : '0s'}}
            >
                <button
                onClick={handleSearch}
                className="bg-white text-emerald-900 font-bold py-5 px-16 rounded-full border-2 border-white/70 transition-all duration-300 hover:scale-105 shadow-xl text-3xl hover:bg-emerald-50"
                >
                Search
                </button>
            </div>
            
            {/* 선택된 이미지가 없을 때 안내 메시지 */}
            <div 
                className={`text-white text-xl transition-all duration-500 ${
                selectedImages.length === 0 ? 'opacity-100' : 'opacity-0 absolute -z-10'
                }`}
            >
                이미지를 선택하여 관심사를 추가해보세요
            </div>
            </div>
        </div>
        </>
    );
};

export default SearchModeUI; 