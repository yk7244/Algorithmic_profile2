"use client";

import { setReflectionData_reflection1, setReflectionData_reflection2 } from "@/app/utils/save/saveReflectionData";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const subQuestions = [
    "튜브렌즈를 통해 본 당신의 모습은 어땠나요?",
    "질문은 총 3가지예요. 먼저 첫번째 질문을 드려볼게요.",
    "그렇게 느끼셨다니, 흥미로워요! ",
    "마지막으로, ",
    "알고리즘 프로필 돌아보기가 끝났어요.",
    "이번 경험이 알고리즘을 당장 바꾸진 않더라도, ",
    " 언제든 그 방향을 이야기할 준비가 되어 있다는 건,",
    "이제, "

];

const questions = [
    "감상을 남겨주세요.",
    "Q1. 알고리즘이 바라본 ‘나는’ 어떤 사람이었나요?",
    "Q2. 알고리즘이 바라본 ‘나’는, 내가 생각하는 나와 얼마나 닮아 있었나요?",
    "Q3. 알고리즘 프로필’을 보고 느낀 생각이나 감정은 무엇인가요",
    "",
    " 스스로의 관심사와 그 방향을 더 또렷하게 마주하게 되었기를 바래요",
    "이미 당신이 자신의 삶을 설계해 나가고 있다는 증거니까요.",
    "새로운 알고리즘을 직접 탐색하는 시간을 가져볼까요? "
];

export default function ReflectionQuestionsPage() {
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

    return (
        <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* 배경 */}
        <div className="absolute left-[10%] top-[20%] w-[80%] h-[60%] rounded-full bg-white blur-[120px] animate-blob animation-delay-200" />

        {/* 질문 콘텐츠 */}
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-6">
            <div className="mb-10 w-[40px] h-[40px] rounded-full bg-[#3B71FE] blur-[9px] animate-blob-move" />
        
            <h1 className="text-black text-xl font-semibold mb-1">{subQuestions[currentIndex]}</h1> 
            <h1 className="text-black text-xl font-semibold mb-8">{questions[currentIndex]}</h1>

            {/* 입력 필드: Q1~Q3에만 보임 */}
            {currentIndex >= 1 && currentIndex <= 3 && (
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
                <div className="flex flex-row gap-4">  
                    <button
                        className="mt-10 text-gray-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"

                        onClick={() => {
                            router.push("/my_page"); 
                            setReflectionData_reflection1();
                        }}
                        >
                        마이페이지로 돌아가기
                        <ArrowRight className="ml-1 w-5 h-5" />
                    </button>
                    <button
                        className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"

                        onClick={() => {
                            router.push("/my_profile?explore=1"); 
                            setReflectionData_reflection1();
                        }}
                        >
                        알고리즘 탐색하기
                        <ArrowRight className="ml-1 w-5 h-5" />
                    </button>
                </div>
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
