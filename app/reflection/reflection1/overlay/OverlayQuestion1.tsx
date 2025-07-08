import React from "react";
// import { useRouter } from "next/navigation"; // not needed here

interface OverlayQuestionProps {
    onLeftClick?: () => void;
    onRightClick?: () => void;
}

const OverlayQuestion1: React.FC<OverlayQuestionProps> = ({
    onLeftClick,
    onRightClick,
    }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
        background:
            "rgba(141, 141, 141, 0.8)",
        }}
    >
        {/* 블루 glow */}
        {/* 배경 */}
        <div className="absolute left-[10%] top-[0%] w-[80%] h-[60%] rounded-full bg-white blur-[120px] animate-blob animation-delay-200" />

        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[40px] h-[40px] rounded-full bg-[#3B71FE] blur-[9px] animate-pulse" />

        {/* 중앙 컨텐츠 */}
        <div className="relative flex flex-col items-center top-[-10%]">
        <div className="text-center text-xl font-medium mb-12 leading-relaxed">
            <span className="block">
            다른 사람들의 알고리즘 탐색을 시작하기 전에,
            </span>
            <span className="block mt-2">
            내 알고리즘이 말하는 <b>'나'와 진짜 '나'</b>의 기준이<br />
            얼마나 <b>같고, 달랐는지</b> 느껴보셨나요?
            </span>
        </div>
        <div className="flex gap-16 text-xl font-bold">
            <button
            className="text-gray-500 hover:text-black transition"
            onClick={onLeftClick}
            >
            아니요 아직요 ✗
            </button>
            <button
            className="text-blue-600 hover:underline flex items-center transition"
            onClick={onRightClick}
            >
            네 느꼈어요 <span className="ml-2">→</span>
            </button>
        </div>
        </div>
    </div>
);

export default OverlayQuestion1; 