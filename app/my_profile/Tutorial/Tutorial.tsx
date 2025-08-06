import { setReflectionData_tutorialDB } from "../../utils/save/saveReflection";
import { LucideMousePointerClick, MousePointer2Icon, MousePointerClick, MousePointerClickIcon } from "lucide-react";
import React, { useState } from "react";

interface TutorialProps {
    show: boolean;
    onClose: () => void;
}


const Tutorial: React.FC<TutorialProps> = ({ show, onClose }) => {
    if (!show) return null;
    const [isClicked, setIsClicked] = useState(false);
    return (
        <div className="z-20 absolute inset-y-0 right-0 mr-0 w-full h-full flex items-center justify-center bg-white/20  backdrop-blur-[30px]">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                {!isClicked ? (
                    <>
                    <button 
                    className=" top-8 right-8 px-6 py-3 bg-black/80 text-white rounded-full 
                    font-bold text-base z-10 hover:bg-black/80 hover:scale-105 transition"
                    onClick={() => setIsClicked(true)}>
                        나의 알고리즘 자화상 확인하기
                    </button>
                    </>
                ):(
                    <>
                    <div className="text-sm text-black opacity-40 text-center font-semibold">
                        잠깐, 결과를 확인 하기 전,<br/>   
                        간단한 알고리즘 자화상에 대한 설명이예요
                    </div>
                    <div className="text-lg text-black/80 opacity-80 text-center font-semibold mt-4">
                        알고리즘 자화상은 내가 본 유튜브 영상 기록으로 만든 
                        <span className="font-extrabold text-black/90">‘내 모습을 비춘 이미지 콜라주’</span>이에요. <br/>
                        유튜브 속 나의 모습을 거울처럼 다시 표현했어요.
                    </div>
                    <div className="mt-2 flex flex-col items-center group">
                        <div className="pl-30 flex flex-col items-center absolute">
                            <div className="mt-4 mb-1 text-blue-400 text-sm font-bold text-center group-hover:scale-105 transition">
                                # 알고리즘 정체성 키워드
                            </div>
                            <div className="w-[160px] h-[160px] bg-white shadow-xl flex flex-col items-center justify-center relative
                            group-hover:scale-105">
                                <div className="text-blue-600 text-sm font-bold text-center">
                                내가 시청했던<br/>유튜브 썸네일
                                </div>                            
                                <MousePointerClickIcon className="absolute pl-1 bottom-3 right-8 w-10 h-10 text-blue-500 drop-shadow-lg" />
                            </div>
                        </div>
                        
                        <div className="flex flex-row ml-[350px] items-center mt-20 justify-center">
                            <img src="/images/direction.png" alt="알고리즘 자화상 예시" className="w-[70px] h-[100px] object-contain group-hover:scale-105 transition" />
                            <div className="ml-2 text-blue-500 text-xs font-semibold text-center group-hover:scale-105 transition">
                                추천 알고리즘에 반영되는 비율이 <br/>
                                클수록 큰 이미지로 표현돼요.
                            </div>
                        </div>
                        
                    </div>
                    <div className="text-lg text-black/80 opacity-80 text-center font-semibold mt-14">
                    이미지를 클릭하면 추천 알고리즘의 구체적인 설명도 볼 수 있어요.
                    </div>

                    <div className="mt-3 text-sm text-black opacity-40 text-center font-semibold">
                    지금, 유튜브 속 ‘당신’은 어떤 모습일까요? <br/>
                    당신의 알고리즘 자화상을 거울처럼 가볍게 들여다 보세요.
                    </div>
                    <button
                    className="mt-10 top-8 right-8 px-6 py-2 bg-black/80 text-white rounded-full 
                    font-bold text-base z-10 hover:bg-black/80 hover:scale-105 transition"
                    onClick={async () => {
                        onClose();
                        await setReflectionData_tutorialDB();
                    }}
                >
                    확인하기
                    </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Tutorial;
