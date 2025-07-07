"use client";

import { ArrowUpRight, ArrowRight, Link } from "lucide-react";
import { useState } from "react";
import { getUserData } from "@/app/utils/get/getUserData";
import { getLatestProfileData, getProfileData } from "@/app/utils/get/getProfileData";
import { useRouter } from "next/navigation";
import { setReflectionData, setReflectionData_reflection2 } from "@/app/utils/save/saveReflectionData";

const subQuestions = [
    "다시 만나게 되어 반가워요. 튜브렌즈에서의 여정은 즐거우셨나요?",
    "Q1. 내가 주도적으로 선택한 알고리즘을 탐색하면서,",
    "Q2. 이후, 내가 어떤 콘텐츠를 더 보고 싶어졌는지, 혹은 앞으로 유튜브를 어떻게 탐색하고 싶은지 등 ",
    "리플랙션 공간에서 표현해주셔서 감사해요.",
    "스스로 선택하고 탐색한 흐름은,",
    "이제, 업로드할 모든 준비가 되었어요."
];

const questions = [
  "튜브렌즈에서의 여정, 함께 되돌아봐도 괜찮을까요?",
  "새롭게 이해하게 된 관점이나 감정이 있었나요?",
  " 어떤 생각이 드셨나요?",
  "짧은 시간 이렇게나 변화하신 모습이 인상적이었어요.",
  "앞으로 어떤 시청을 만들어갈지에 대한 강한 힌트가 되어줄 거예요.", 
  "새로운 알고리즘 프로필에서는, 어떤 점이 달라져 있을까요?"
  
];

export default function ReflectionQuestionsPage2() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>(["", "", ""]);
    const router = useRouter();     

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updated = [...answers];
        updated[currentIndex - 1] = e.target.value; // 입력은 Q1~Q3 (index 1부터)
        setAnswers(updated);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        } else {
        console.log("최종 답변:", answers);
        // router.push("/thanks") 가능
        }
    };
    const userData = getLatestProfileData();
    console.log('userData', userData);

    return (
        <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* 배경 */}
        <div className="absolute left-[10%] top-[20%] w-[80%] h-[60%] rounded-full bg-white blur-[120px] animate-blob animation-delay-200" />

        {/* 질문 콘텐츠 */}
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-6">
            <div className="mb-10 w-[40px] h-[40px] rounded-full bg-[#3B71FE] blur-[9px] animate-blob-move" />

            {currentIndex === 0 && (
                <h1 className="text-black text-xl font-semibold mb-1">안녕하세요! {userData?.nickname}님</h1>
            )}
        
            <h1 className="text-black text-xl font-semibold mb-1">{subQuestions[currentIndex]}</h1> 
            <h1 className="text-black text-xl font-semibold mb-8">{questions[currentIndex]}</h1>

            {/* 입력 필드: Q1~Q3에만 보임 */}
            {currentIndex >= 1 && currentIndex <= 2 && (
            <div className="flex items-center bg-white rounded-full shadow-lg px-6 py-4 w-full max-w-2xl">
                <input
                type="text"
                value={answers[currentIndex - 1]}
                onChange={handleInputChange}
                placeholder="Text"
                className="flex-grow text-black bg-transparent outline-none text-base placeholder-gray-400"
                />
                <button
                onClick={handleNext}
                className="ml-4 p-2 rounded-full bg-black text-white hover:bg-gray-800 transition"
                >
                <ArrowUpRight className="w-5 h-5" />
                </button>
            </div>
            )}

            {/* 하단 Next 버튼: 항상 있음 */}
            {currentIndex < questions.length - 1 ? (
                <button
                onClick={handleNext}
                className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"
                >
                Next
                <ArrowRight className="ml-1 w-5 h-5" />
                </button>
            ):(
                <>  
                <button
                className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"

                onClick={() => {
                    router.push("/my_page"); 
                    setReflectionData_reflection2();
                }}
                >
                Finish
                <ArrowRight className="ml-1 w-5 h-5" />
                </button>
                </>
            )}
            
        </main>

        {/* 애니메이션 정의 */}
        <style jsx global>{`
            @keyframes diagonal-move {
            0%, 100% {
                transform: translate(0px, 0px);
            }
            50% {
                transform: translate(30px, -20px);
            }
            }
            .animate-diagonal {
            animation: diagonal-move 8s ease-in-out infinite;
            }
        `}</style>
        </div>
    );
}
