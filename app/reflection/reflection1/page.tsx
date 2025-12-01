"use client";

import { setReflection_answer, setReflectionData_reflection1, setReflectionData_reflection1DB, setReflection_answerDB } from "@/app/utils/save/saveReflection";
import { updateReflectionAnswer } from "@/app/utils/save/saveReflection";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const subQuestions = [
    "What did the portrait describe about you?",
    "There are 3 questions in total. Let's start with the first question.",
    "I'm interested in that! ",
    "Finally, ",
    "The algorithm visualization recording is over.",    
    "Now, "
];

const questions = [
    "Leave your impressions.",
    "Q1. How did the portrait describe you?",
    "Q2. How similar was the self represented by the algorithm with the way you perceive yourself? ",
    "Q3. Were there any thoughts and feelings evoked by the portrait? ",
    "I hope you can more clearly face your own interests. ",
    "Let's take some time to explore a new algorithm. "
];

export default function ReflectionQuestionsPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>(["", "", ""]);
    const [sliderValue, setSliderValue] = useState(3);
    const [showTimeoutMsg, setShowTimeoutMsg] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(parseInt(e.target.value));
    };    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updated = [...answers];
        updated[currentIndex - 1] = e.target.value; // 입력은 Q1~Q3 (index 1부터)
        setAnswers(updated);
    };

    const handleNext = () => {
        // Q1, Q3: 텍스트 답변 저장
        console.log('🔵currentIndex',currentIndex);
        console.log('questions.length - 1',questions.length - 1);
        
        if (currentIndex === 1 || currentIndex === 3) {
            if (answers[currentIndex - 1].length <= 25){
                alert("Please write at least 25 characters.");
                return;
            }
            // localStorage 저장은 완료 시 한 번에 처리
            console.log(`Q${currentIndex} 답변:`, answers[currentIndex - 1]);
        }
        // Q2: 슬라이더 값 로그
        if (currentIndex === 2) {
            console.log('Q2 slider value:', sliderValue);
        }
        if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        } else {
        console.log("Final answer:", answers);
        // router.push("/thanks") 가능
        }
        if (currentIndex === questions.length - 2) {
            // setReflection_answer(); // TODO: DB 버전으로 대체 필요
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-300 text-black flex flex-col overflow-hidden">
        {/* 배경 */}
        <div className="absolute left-[10%] top-[20%] w-[80%] h-[60%] rounded-full bg-white blur-[120px] animate-blob animation-delay-200" />

        {/* 질문 콘텐츠 */}
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-6">
            <div className="mb-10 w-[40px] h-[40px] rounded-full bg-[#3B71FE] blur-[9px] animate-pulse" />
        
            <h1 className="text-black text-xl font-semibold mb-1">{subQuestions[currentIndex]}</h1> 
            <h1 className="text-black text-xl font-semibold mb-3">{questions[currentIndex]}</h1>
            {currentIndex === 4 && (
                <div className="text-gray-400 font-bold text-[14px] mb-4">The impressions you wrote will not be reflected in the algorithm. </div>
            )}
            {currentIndex === 5 && (
                <div className="text-gray-400 font-bold text-[14px] mb-4">
                    The contents you wrote are being saved. Please wait a moment.
                </div>
            )}

            {/* 입력 필드: Q1~Q3에만 보임 */}
            { currentIndex === 1 || currentIndex === 3 ? (
                <>
                <div className="text-gray-400 text-[12px] mb-10">
                    Please write at least 25 characters.
                </div>
                <div className="flex items-center bg-white rounded-full shadow-2xl px-6 py-4 w-full max-w-2xl">
                    <input
                    type="text"
                    value={answers[currentIndex - 1]}
                    onChange={handleInputChange}
                    placeholder={`${currentIndex === 1 ? "Example answer: I really seem to be interested in cats." : 
                        currentIndex === 3 ? "Example answer: I thought I should use YouTube more productively." : ""}`}
                    minLength={25}
                    maxLength={300}
                    className="flex-grow text-black bg-transparent outline-none text-base placeholder-gray-400 pl-4 placeholder:text-sm placeholder:text-gray-300"
                    />
                </div>
                
                </>
            ):currentIndex === 2 ?  (
                <>
                <div className="w-full max-w-2xl ">
                    <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={sliderValue}
                        onChange={handleSliderChange}           
                        className="mt-10 mb-4 w-[85%] h-10 rounded-full bg-gray-200 appearance-none accent-blue-500  shadow-2xl shadow-gray-300
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:h-10 
                        [&::-webkit-slider-thumb]:w-10 
                        [&::-webkit-slider-thumb]:mt-[-1px]
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2 
                        [&::-webkit-slider-thumb]:border-white 
                        [&::-webkit-slider-thumb]:shadow 

                        [&::-moz-range-thumb]:h-6 
                        [&::-moz-range-thumb]:w-6 
                        [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-2 
                        [&::-moz-range-thumb]:border-gray-300 
                        [&::-moz-range-thumb]:shadow-4xl"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(sliderValue - 1) * 23}%, #e5e7eb ${(sliderValue - 1) * 25}%, #e5e7eb 100%)
                            `
                        }}    
                    />
                    </div>

                    <div className="flex justify-between w-full max-w-2xl text-sm text-gray-600 font-medium ">
                        <div className={`${sliderValue === 1 ? "opacity-100" : "opacity-0"} bg-white px-3 py-1 rounded-full shadow text-center text-[12px]`}>
                            ❌ I couldn't agree
                        </div>
                        <div className={`${sliderValue === 2 ? "opacity-100" : "opacity-0"} bg-white px-3 py-1 rounded-full shadow text-center text-[12px]`}>
                            🤔 I think it's a bit different
                        </div>
                        <div className={`${sliderValue === 3 ? "opacity-100" : "opacity-0"} bg-white px-3 py-1 rounded-full shadow text-center text-[12px]`}>
                            😐 I don't know
                        </div>
                        <div className={`${sliderValue === 4 ? "opacity-100" : "opacity-0"} bg-white px-3 py-1 rounded-full shadow text-center text-[12px]`}>
                            🙂 I agree partially
                        </div>
                        <div className={`${sliderValue === 5 ? "opacity-100" : "opacity-0"} bg-white px-3 py-1 rounded-full shadow text-center text-[12px]`}>
                            👍 I agree mostly
                        </div>
                    </div>
                </>
            ):(
                <>
                </>
            )}

            {/* 하단 Next 버튼: 항상 있음 */}
            {currentIndex < questions.length - 1 ? (
                <>  
                <button
                onClick={handleNext}
                className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"
                >
                    {currentIndex === 3 ? "Complete" : "Next"}
                <ArrowRight className="ml-1 w-5 h-5" />
                </button>
                </>
            ):(
                <>
                <div className="flex flex-row gap-4">  
                    <button
                        className="mt-10 text-gray-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"

                        onClick={async () => {
                            setShowTimeoutMsg(false);
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            timeoutRef.current = setTimeout(() => {
                                setShowTimeoutMsg(true); // 10초 후 안내 메시지 확실히 표시
                            }, 10000);

                            // DB에 reflection1 완료 상태와 답변 저장
                            const reflection1Answers = {
                                answer1: answers[0],
                                answer2: String(sliderValue),
                                answer3: answers[2]
                            };
                            console.log('🔄 reflection1 답변 DB 저장 중:', reflection1Answers);
                            const success = await setReflectionData_reflection1DB(reflection1Answers);

                            // 🔄 reflection_answers 테이블에 히스토리 저장
                            if (success) {
                                const historyData = [{
                                    id: Date.now().toString(),
                                    user_id: '0', // 실제로는 함수 내부에서 처리됨
                                    timestamp: new Date().toISOString(),
                                    reflection1: true,
                                    reflection2: false,
                                    searched: false,
                                    tutorial: false,
                                    reflection1_answer: reflection1Answers,
                                    reflection2_answer: { answer1: '', answer2: '' }
                                }];
                                
                                console.log('📚 reflection1 답변 히스토리 저장 중:', historyData);
                                const historySuccess = await setReflection_answerDB(historyData);
                                console.log(historySuccess ? '✅ reflection1 히스토리 저장 성공' : '⚠️ reflection1 히스토리 저장 실패 (메인 저장은 성공)');
                            }

                            if (timeoutRef.current) clearTimeout(timeoutRef.current); // 저장 요청이 끝나면(성공/실패 상관없이) 타이머를 해제합니다.
                            console.log(success ? '✅ reflection1 답변 DB 저장 성공' : '❌ reflection1 답변 DB 저장 실패');
                            if (success) {
                                router.push("/my_profile"); 
                            } else {
                                setShowTimeoutMsg(true); // 저장 실패 시 안내 메시지 표시
                            }
                        }}
                        >
                        Go back
                        <ArrowRight className="ml-1 w-5 h-5" />
                    </button>
                    <button
                        className="mt-10 text-blue-500 text-lg font-semibold inline-flex items-center hover:text-blue-600 transition"

                        onClick={async () => {
                            setShowTimeoutMsg(false);
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            timeoutRef.current = setTimeout(() => {
                                setShowTimeoutMsg(true); // 10초 후 안내 메시지 확실히 표시
                            }, 10);
                            // DB에 reflection1 완료 상태와 답변 저장
                            const reflection1Answers = {
                                answer1: answers[0],
                                answer2: String(sliderValue),
                                answer3: answers[2]
                            };
                            console.log('🔄 reflection1 답변 DB 저장 중:', reflection1Answers);
                            const success = await setReflectionData_reflection1DB(reflection1Answers);

                            // 🔄 reflection_answers 테이블에 히스토리 저장
                            if (success) {
                                const historyData = [{
                                    id: Date.now().toString(),
                                    user_id: '0', // 실제로는 함수 내부에서 처리됨
                                    timestamp: new Date().toISOString(),
                                    reflection1: true,
                                    reflection2: false,
                                    searched: false,
                                    tutorial: false,
                                    reflection1_answer: reflection1Answers,
                                    reflection2_answer: { answer1: '', answer2: '' }
                                }];
                                
                                console.log('📚 reflection1 답변 히스토리 저장 중 (탐색하기):', historyData);
                                const historySuccess = await setReflection_answerDB(historyData);
                                console.log(historySuccess ? '✅ reflection1 히스토리 저장 성공 (탐색하기)' : '⚠️ reflection1 히스토리 저장 실패 (메인 저장은 성공)');
                            }

                            if (timeoutRef.current) clearTimeout(timeoutRef.current); // 저장 요청이 끝나면(성공/실패 상관없이) 타이머를 해제합니다.
                            console.log(success ? '✅ reflection1 답변 DB 저장 성공' : '❌ reflection1 답변 DB 저장 실패');

                            if (success) {
                                router.push("/search"); 
                            } else {
                                setShowTimeoutMsg(true); // 저장 실패 시 안내 메시지 표시
                            }

                        }}
                        >
                        Explore other algorithms
                        <ArrowRight className="ml-1 w-5 h-5" />
                    </button>
                    
                </div>
                {/* 안내 메시지 */}
                {showTimeoutMsg && (
                    <> 
                    <div className="w-full text-center mt-4 items-center justify-center flex flex-col ">
                        <div className="text-red-500 text-sm font-semibold animate-pulse mt-10"> 
                           
                        </div>
                        <div className="text-gray-500 text-xs mt-2 bg-white px-3 py-1 rounded-lg shadow text-center text-[12px] w-fit py-4 px-8 items-center justify-center flex flex-col">
                            Answer1. {answers[0]}<br/>
                            Answer2. Recurrence scale {sliderValue} points<br/>
                            Answer3. {answers[2]}<br/>

                            <div onClick={() => {
                                window.open("https://forms.gle/JDQZQssCVJziRafC6", "_blank");
                            }}
                            className="text-white text-sm font-semibold hover:text-white transition bg-blue-500 px-3 py-1 cursor-pointer
                            rounded-full shadow text-center text-[12px] mt-10 w-fit hover:bg-blue-600">
                                https://forms.gle/JDQZQssCVJziRafC6 
                            </div>
                        </div>
                        
                    </div>
                    
                    </>
                )}
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
