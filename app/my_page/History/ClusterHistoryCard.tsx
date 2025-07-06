import { ClusterHistory } from "@/app/types/profile";   
import { Sparkles } from "lucide-react";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import { AnalysisCard } from "@/app/my_page/Anlysis/AnlysisCard";
import React, { useState } from "react";
import { AnalysisModal } from "@/app/my_page/Anlysis/AnalysisModal";

// ClusterHistory 카드 컴포넌트
export const ClusterHistoryCard: React.FC<{ history: ClusterHistory }> = ({ history }) => {
const [open, setOpen] = useState(false);        
const updateDate = isOneWeekPassed();


return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
        
        
        <div className="bg-gray-100 rounded-full px-2 py-1 w-fit text-xs text-gray-500 mb-2">{history.created_at?.slice(0, 10)}</div>
        <div className="flex flex-col pl-2">
            <div className="pt-2 font-bold text-lg mb-2">{history.mood_keyword}</div>
            <div className="text-gray-600 mb-7">{history.description}</div>
            <div className="text-sm text-gray-500 mb-1">총 분석 영상 수: <span className="font-bold">{history.relatedVideos?.length ?? 0}</span></div>
            <div className="text-sm text-gray-500 mb-1">총 키워드 수: <span className="font-bold">{history.keywords?.length ?? 0}</span></div>
            <div className="text-sm text-gray-500 mb-1">
                알고리즘 프로필 핵심 키워드: {history.keywords?.slice(0, 5).map(k => `#${k}`).join(", ")}
            </div>
        </div>
        <div className="flex flex-row justify-end gap-2 p-4 ">
            <button className="bg-black text-white rounded-full px-6 py-3 text-md font-bold shadow transition hover:bg-gray-900"
            onClick={() => setOpen(true)}
            >
                알고리즘 프로필 분석 과정 살펴보기
            </button>
            <button className="bg-blue-600 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700">
                <Sparkles className="w-5 h-5" />
                알고리즘 프로필 리플랙션 하기
            </button>
        </div>
        {/* 모달 */}
        <AnalysisModal open={open} onClose={() => setOpen(false)} history={history} />
    </div>
    );
}