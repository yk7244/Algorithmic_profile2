import { ClusterHistory } from "@/app/types/profile";   
import { Sparkles } from "lucide-react";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import React, { useState, useEffect } from "react";
import { getClusterHistory } from "@/app/utils/get/getClusterHistory";
import { getWatchHistory } from "@/app/utils/get/getWatchHistory";
import { AnalysisModal } from "@/app/my_page/Analysis/AnalysisModal";
import { setReflectionData } from "@/app/utils/save/saveReflectionData";
import { getReflectionData } from "@/app/utils/get/getReflectionData";
import { ReflectionData } from "@/app/types/profile";
import { useRouter } from "next/navigation";

// ClusterHistory 카드 컴포넌트
export const ClusterHistoryCard: React.FC<{ history: ClusterHistory }> = ({ history  }) => {
    const router = useRouter();
    if (!history) return null;
    const [open, setOpen] = useState(false);     
    //console.log('history!!!', history);
    //console.log('history.images!!!', history.images);

    const watchHistory = getWatchHistory();
    //날짜 찾기 
    const totalVideos = watchHistory.length;
    const allKeywords = watchHistory.flatMap((v) => v.keywords || []);
    const totalKeywords = allKeywords.length;

    const reflectionData = getReflectionData();
    console.log('확인 reflectionData', reflectionData?.reflection1 ?? false);       
    const isDisabled = reflectionData?.reflection1 !== false;

    //const reflectionData = getReflectionData();
    //console.log('reflectionData', reflectionData);

    return (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <div className="bg-gray-100 rounded-full px-2 py-1 w-fit text-xs text-gray-500 mb-2">{history.created_at?.slice(0, 10)}</div>
            <div className="flex flex-col pl-2">
                <div className="pt-2 font-bold text-lg mb-2">{history.nickname}</div>
                <div className="text-gray-600 mb-7">{history.description}</div>
                <div className="text-sm text-gray-500 mb-1">총 분석 영상 수: <span className="font-bold">{totalVideos ?? 0}</span></div>
                <div className="text-sm text-gray-500 mb-1">총 키워드 수: <span className="font-bold">{totalKeywords ?? 0}</span></div>
                <div className="text-sm text-gray-500 mb-1">
                    알고리즘 프로필 핵심 키워드: {history.images.map(image => `#${image.main_keyword}`).join(", ")}
                </div>
            </div>
            <div className="flex flex-row justify-end gap-2 p-4 ">
                <button className="bg-black text-white rounded-full px-6 py-3 text-md font-bold shadow transition hover:bg-gray-900"
                onClick={() => {
                    setOpen(true);
                    setReflectionData();
                }}
                >
                    알고리즘 프로필 분석 과정 살펴보기
                </button>

                <button className="bg-blue-600 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700"
                        onClick={() => {
                            router.push('/reflection/reflection1');         
                        }}
                        disabled={isDisabled}
                        style={{
                            opacity: isDisabled ? 0.5 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                        }}
                    >
                        <Sparkles className="w-5 h-5" />
                        알고리즘 프로필 리플랙션 하기
                    </button>
            </div>
            <AnalysisModal open={open} onClose={() => setOpen(false)} history={history} /> 
        </div>
    );
}