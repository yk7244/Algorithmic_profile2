import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pen, Save, Sparkles } from "lucide-react";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { saveProfileImages } from "@/app/utils/save/saveImageData";
import { savePositions } from "./Hooks/savePosition";
import { useRouter } from 'next/navigation';
import { getReflectionData } from "@/app/utils/get/getReflectionData";
import OverlayQuestion1 from "../../reflection/reflection1/overlay/OverlayQuestion1";
import OverlayQuestion2 from "../../reflection/reflection2/overlay/OverlayQuestion2";

interface BottomActionBarProps {
    isEditing: boolean;
    isGeneratingProfile: boolean;
    onEditClick: () => void;
    offEditClick: () => void;
    images: any[];
    positions: Record<string, {x: number, y: number}>;
    onGenerateProfile: () => void;
    sliderCurrentHistoryIndex: number;
    isSearchMode: boolean;
    toggleSearchMode: () => void;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
    isEditing,
    isGeneratingProfile,
    onEditClick,
    offEditClick,
    images,
    positions,
    onGenerateProfile,
    sliderCurrentHistoryIndex,
    isSearchMode,
    toggleSearchMode,
}) => {
    const router = useRouter();
    const [showOverlayQuestion1, setShowOverlayQuestion1] = useState(false);
    const [showOverlayQuestion2, setShowOverlayQuestion2] = useState(false);
    if (sliderCurrentHistoryIndex !== -1) {
        return null;
    }

    // 위치 병합 후 저장하는 함수
    const savePositions = () => {
        const updatedImages = images.map(img => {
            const pos = positions[img.id];
            if (pos) {
                return {
                    ...img,
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    position: { x: pos.x, y: pos.y },
                };
            }
            return img;
        });
        console.log('updatedImages', updatedImages);
        saveProfileImages(updatedImages);
    };
    
    const reflectionData = getReflectionData();
    //console.log('확인 reflectionData', reflectionData?.reflection1 ?? false);       
    const isReflection1 = reflectionData?.reflection1 !== false;
    const isReflection2 = reflectionData?.reflection2 !== false;

    return (
        <>
            
            {!isEditing ? (
            <div className="fixed right-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-20 bg-white/70 
            backdrop-blur-lg rounded-full py-6 px-3 shadow-xl transition-all duration-10000">
                {/* 1번 버튼 : 수정하기/저장 */}
                <div className="relative group flex flex-row items-center justify-center">
                    <div className = "mr-2 text-gray-400 text-sm">1</div>
                    <button
                        className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md transition-all hover:bg-black group"
                        onClick={onEditClick}
                    >
                        
                        <Pen className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                    </button>
                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-black/80 after:border-r-transparent after:ml-[-1px]">
                        무드보드 이미지나 위치가 이상한가요? 직접 조정해보세요
                    </div>
                </div>
                {/* 2번 버튼 : 리플렉션1번 첫인상 */}
                <div className="relative group flex flex-row items-center justify-center">
                    <div className = "mr-2 text-gray-400 text-sm">2</div>

                    <button
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md transition-all hover:bg-black group"
                    onClick={() => router.replace('/reflection/reflection1')}
                    >
                    <AutoAwesomeIcon className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                    </button>
                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-black/80 after:border-r-transparent after:ml-[-1px]">
                    나의 알고리즘 자화상에 대한 첫인상을 남겨보세요
                    </div>
                </div>


                {/* 3번 버튼 :탐색 */}
                <div className="relative group flex flex-row items-center justify-center">
                    <div className = "mr-2 text-gray-400 text-sm">3</div>

                    <button
                        className={`group relative w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 overflow-hidden ${
                            isReflection1 
                                ? 'bg-white hover:scale-110 active:scale-95' 
                                : 'bg-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                        disabled={!isReflection1}
                        onClick={() => {
                            if (isReflection1) {
                                router.replace('/my_profile?explore=1');
                            } else {
                                setShowOverlayQuestion1(true);
                            }
                        }}
                        aria-label={isSearchMode ? '검색 모드 종료' : '검색하기'}
                    >
                        {/* 애니메이션 그라데이션 테두리 - 활성화 상태에서만 */}
                        {isReflection1 && (
                            <>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 via-red-500 via-orange-500 via-yellow-400 via-green-400 to-blue-400 bg-[length:400%_400%] animate-gradient-border p-1">
                                    <div className="w-full h-full rounded-full bg-white group-hover:bg-transparent group-active:bg-transparent transition-colors duration-300"></div>
                                </div>
                                
                                {/* 호버 시 그라데이션 배경 */}
                                <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 via-red-500 via-orange-500 via-yellow-400 via-green-400 to-blue-400 bg-[length:400%_400%] animate-gradient-border opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
                                
                                {/* 클릭 시 더 진한 그라데이션 배경 */}
                                <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 via-pink-600 via-red-600 via-orange-600 via-yellow-500 via-green-500 to-blue-500 bg-[length:400%_400%] animate-gradient-border opacity-0 group-active:opacity-90 transition-opacity duration-150"></div>
                                
                                {/* 호버 시 펄스 효과 */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 group-hover:animate-ping"></div>
                            </>
                        )}
                        
                        {/* 아이콘 */}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`relative z-10 w-5 h-5 transition-colors duration-200 ${
                            isReflection1 
                                ? 'text-black group-hover:text-white group-active:text-white' 
                                : 'text-gray-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-black/80 after:border-r-transparent after:ml-[-1px]">
                        {isReflection1 
                            ? '다른 사람의 알고리즘이 궁금한가요? 다른 사람들의 알고리즘 자화상을 탐색해보세요! '
                            : '알고리즘 자화상 첫인상 남기기(2번)을 먼저 완료해주세요.'
                        }
                    </div>
                </div>
                
            </div>
                
            ) : (
                <div className="fixed bottom-20 right-20 flex flex-col gap-3 z-50 transition-all duration-300">

                    <button
                    className={`h-12 px-8 border border-gray-200 flex items-center gap-2 rounded-full shadow-md bg-black text-white hover:text-gray-200 hover:bg-gray-600`}                    
                    onClick={() => {
                        savePositions();
                        offEditClick();
                    }}
                    >
                    <Save className="w-5 h-5 text-white" />
                    저장하기
                    </button>
                    

                </div>
            )}
            {showOverlayQuestion1 && (
                <OverlayQuestion1
                    onLeftClick={() => setShowOverlayQuestion1(false)}
                    onRightClick={() => router.replace('/reflection/reflection1')}
                />
            )}
            {showOverlayQuestion2 && (
                <OverlayQuestion2
                    onLeftClick={() => setShowOverlayQuestion2(false)}
                    onRightClick={() => router.replace('/reflection/reflection2')}
                />
            )}
        </>

    );
};

export default BottomActionBar; 