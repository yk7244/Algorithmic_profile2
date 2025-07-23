"use client";

import { ArrowUpRight, ArrowRight, Link } from "lucide-react";
import { useState } from "react";
import { getUserData } from "@/app/utils/get/getUserData";
import { getLatestProfileData, getProfileData } from "@/app/utils/get/getProfileData";
import { useRouter } from "next/navigation";
import { setReflection_answer, setReflectionData, setReflectionData_reflection2, updateReflectionAnswer } from "@/app/utils/save/saveReflection";

const subQuestions = [
    "지난 한 주, 튜브렌즈에서의 경험은 어떠셨나요?",
    "Q1. 지난 한 주 튜브렌즈를 사용하면서 들었던 감정이나 스스로에 대해 새롭게 발견하게 된 점이 있나요? ",
    "Q2. 지난 한 주 튜브렌즈를 사용하면서 유튜브를 사용하는 방식에 변화가 생긴 부분이 있나요?  ",
    "리플랙션 공간에서 표현해주셔서 감사해요.",
    "스스로 선택하고 탐색한 흐름은,",
    "이제, 업로드할 모든 준비가 되었어요."
];

const questions = [
    "함께 되돌아볼까요?",
    "이 과정에 특히 도움이 된 튜브렌즈의 기능이 있다면 함께 공유해주세요.",
    "있다면 자유롭게 공유해주세요.",
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
        if (currentIndex === 1 ) {
            if (answers[currentIndex - 1].length <= 25){
                alert("25자 이상 작성해주세요.");
                return;
            }
        updateReflectionAnswer({
            reflectionKey: "reflection2_answer",
                answerKey: "answer1",
                value: answers[currentIndex - 1]
            });
        }
        if (currentIndex === 2) {
            if (answers[currentIndex - 1].length <= 25){
                alert("25자 이상 작성해주세요.");
                return;
            }
            updateReflectionAnswer({
                reflectionKey: "reflection2_answer",
                answerKey: "answer2",
                value: answers[currentIndex - 1]
            });
        }

        if (currentIndex === questions.length - 2) {
            setReflection_answer(); //계속 스택으로 쌓임
        }
    };
    const userData = getLatestProfileData();
    //console.log('userData', userData);

    return (
        <div className="relative min-h-screen bg-gray-300 text-white flex flex-col overflow-hidden">
        {/* 배경 */}
        <div className="absolute left-[10%] top-[20%] w-[80%] h-[60%] rounded-full bg-white blur-[120px] animate-blob animation-delay-200" />

        {/* 질문 콘텐츠 */}
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-6">
            <div className="mb-10 w-[40px] h-[40px] rounded-full bg-[#3B71FE] blur-[9px] animate-pulse" />

            {currentIndex === 0 && (
                <h1 className="text-black text-xl font-semibold mb-1">안녕하세요! {userData?.nickname}님</h1>
            )}
        
            <h1 className="text-black text-xl font-semibold mb-1">{subQuestions[currentIndex]}</h1> 
            <h1 className="text-black text-xl font-semibold mb-8">{questions[currentIndex]}</h1>

            {/* 입력 필드: Q1~Q3에만 보임 */}
            {currentIndex >= 1 && currentIndex <= 2 && (
                <>
                <div className="text-gray-400 text-[12px] mb-10">
                25자에서 300자 내외로 작성해주세요.
                </div>
                <div className="flex items-center bg-white rounded-full shadow-2xl px-6 py-4 w-full max-w-2xl">
                    <input
                    type="text"
                    value={answers[currentIndex - 1]}
                    onChange={handleInputChange}
                    placeholder={`${currentIndex === 1 ? "예시 답안: 다른 사람들의 관심사를 탐색하는게 저의 관심사를 확장시키는데 효과적이었어요" : 
                        currentIndex === 2 ? "예시 답안: 좀 더 생산적인 컨텐츠를 적극적으로 찾아봤어요" : ""}`}
                    minLength={25}
                    maxLength={300}
                    className="flex-grow text-black bg-transparent outline-none text-base placeholder-gray-400 pl-4 placeholder:text-sm placeholder:text-gray-300"
                    />
                </div>
            </>
            )}

            {/* 하단 Next 버튼: 항상 있음 */}
            {currentIndex < questions.length - 1 ? (
                <button
                onClick={handleNext}
                className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"
                >
                다음
                <ArrowRight className="ml-1 w-5 h-5" />
                </button>
            ):(
                <>  
                <div className="flex flex-row gap-4">  
                    
                    <button
                        className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"

                        onClick={() => {
                            router.push("/"); 
                            setReflectionData_reflection2();
                        }}
                        >
                        알고리즘 자화상 업데이트 하러 가기
                        <ArrowRight className="ml-1 w-5 h-5" />
                    </button>
                </div>
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
