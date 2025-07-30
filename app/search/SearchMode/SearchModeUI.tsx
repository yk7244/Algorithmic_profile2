
import { setReflectionData_searched } from "@/app/utils/save/saveReflection";
import { MousePointer2Icon, MousePointerClick, MousePointerClickIcon } from "lucide-react";
import React, { useState } from "react";

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
    const [show, setShow] = useState(true);
    return (
    <>
        {/* 검색 모드일 때 배경 그라데이션 추가 */}
        <div className="min-h-full fixed inset-0 overflow-hidden -z-10 bg-white">
            <div className="absolute -bottom-[10%] -left-[10%] w-[90%] h-[60%] rounded-full bg-[#B3D4FF] blur-[120px] animate-blob" />
            <div className="absolute -bottom-[60%] -right-[10%] w-[70%] h-[60%] rounded-full bg-[#6B7F99] blur-[120px] animate-blob animation-delay-20" />
            <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#6179A7] blur-[120px] animate-blob animation-delay-200" />
        </div>

        {/* 키워드 태그들과 검색 버튼을 화면 하단에 고정 */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 w-full ">
            <div className="flex flex-col items-end gap-6 transition-all duration-500 mr-20">

                
                {/* 검색 버튼 - 선택된 이미지가 있을 때만 표시 */}
                <div className="flex flex-col items-end gap-4 ">
                    
                    
                    {selectedImages.length === 0 ? (
                    <div    
                        className={`flex flex-col items-end transition-all duration-700 ease-in-out`}
                        style={{transitionDelay: selectedImages.length > 0 ? '0.3s' : '0s'}}
                    >
                        <MousePointerClickIcon className="w-6 h-6 text-white animate-pulse mb-2" />
                        <div className="flex flex-col items-end text-right gap-2">
                        <span className="text-base text-white">
                            새롭게 탐색하고 싶은 <br/>
                            알고리즘 정체성 키워드를 선택하고 <br/>
                            탐색하기를 눌러주세요!
                        </span>
                        </div>
                    </div>
                    ):selectedImages.length >= 1 ? (
                        <div className="flex flex-row gap-4 items-end">
                        {selectedImages.map((img) => (
                            <div 
                                key={img.id} 
                                className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full  animate-fadeIn"
                                style={{animationDelay: `${selectedImages.indexOf(img) * 0.1}s`}}
                            >
                                <span className="text-md font-bold text-white drop-shadow-md">
                                #{img.main_keyword}
                                </span>
                            </div>
                            ))}
                        </div>
                    ):null}
                    
                    <button
                        onClick={() =>{
                            if(selectedImages.length >= 1){
                                handleSearch();
                                setReflectionData_searched();
                            }
                        }}
                        className={`z-30 text-black font-bold py-3 px-10 rounded-full 
                        transition-all duration-300 hover:scale-105 shadow-2xl text-xl hover:bg-blue-500 
                        hover:text-white bg-white ${selectedImages.length === 0 ? 'pointer-events-none' : ''}`}
                        disabled={selectedImages.length === 0}
                        >
                        탐색하기
                    </button>
                    
                </div>
            </div>
        </div>
        </>
    );
};

export default SearchModeUI; 