import React from "react";
// import { useRouter } from "next/navigation"; // not needed here
import LockIcon from '@mui/icons-material/Lock';
interface OverlayQuestionProps {
    onLeftClick?: () => void;
    onRightClick?: () => void;
}

const week = 1;

const OverlayQuestion2: React.FC<OverlayQuestionProps> = ({
    onLeftClick,
    onRightClick,
    }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-lg"
    >
        {/* 블루 glow */}
        {/* 배경 */}
        <div className="absolute left-[10%] top-[0%] w-[80%] h-[60%] rounded-full bg-white blur-[120px] animate-blob animation-delay-200" />

        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-full bg-[#3B71FE] blur-[9px] animate-pulse" />
        
        {/* 중앙 컨텐츠 */}
        <div className="relative flex flex-col items-center top-[-10%]">
            <LockIcon className="mt-20 w-10 h-10 text-white "  fontSize="large" />
            <div className="text-black text-2xl font-bold mt-6">Week {week}</div>
            <div className="mt-8 text-center text-xl font-medium mb-12 leading-relaxed">
                <span className="">
                {week}주차가 시작되었어요.
                </span>
                <span className="block mt-2">
                다음 알고리즘 시각화을 업데이트 하기전, <br />저번 주의 튜브렌즈 여정을 잠시 돌아보는 시간이 필요해요.
                </span> <br />
                Week1 리뷰를 시작해주세요.
            </div>
            <div className="flex gap-16 text-xl font-bold">
                
                <button
                className="text-blue-600 hover:underline flex items-center transition"
                onClick={onRightClick}
                >
                시작하기 <span className="ml-2">→</span>
                </button>
            </div>
        </div>
    </div>
);

export default OverlayQuestion2; 