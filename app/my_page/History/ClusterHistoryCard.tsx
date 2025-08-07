import { ClusterHistory } from "@/app/types/profile";   
import { Sparkles } from "lucide-react";
// import { isOneWeekPassed } from "@/app/utils/uploadCheck"; // 사용하지 않음
import React, { useState, useEffect } from "react";
import { getClusterHistory } from "@/app/utils/get/getClusterHistory";
import { getWatchHistory } from "@/app/utils/get/getWatchHistory";
import { AnalysisModal } from "@/app/my_page/Analysis/AnalysisModal";
import { setReflectionData as initializeReflectionData } from "@/app/utils/save/saveReflection";
import { getReflectionData } from "@/app/utils/get/getReflectionData";
import { ReflectionData } from "@/app/types/profile";
import { useRouter } from "next/navigation";
import { saveWatchHistory_array } from "@/app/utils/save/saveWatchHistory_array";
import { updateReflectionAnswer } from "@/app/utils/save/saveReflection";

// ClusterHistory 카드 컴포넌트
export const ClusterHistoryCard: React.FC<{ history: ClusterHistory, latest: boolean }> = ({ history, latest }) => {
    const router = useRouter();
    if (!history) return null;
    const [open, setOpen] = useState(false);     
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    //console.log('history!!!', history);
    //console.log('history.images!!!', history.images);

    // 비동기 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                
                // DB에서 시청 기록 로드
                const watchHistoryData = await getWatchHistory();
                setWatchHistory(Array.isArray(watchHistoryData) ? watchHistoryData : []);
                
                // DB에서 리플렉션 데이터 로드  
                const reflectionData = await getReflectionData();
                setReflectionData(reflectionData);
                
                console.log('✅ ClusterHistoryCard 데이터 로드 완료');
            } catch (error) {
                console.error('❌ ClusterHistoryCard 데이터 로드 오류:', error);
                setWatchHistory([]);
                setReflectionData(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // 로딩 중일 때
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    //날짜 찾기 
    const totalVideos = Array.isArray(watchHistory) ? watchHistory.length : 0;
    const allKeywords = Array.isArray(watchHistory) ? watchHistory.flatMap((v) => v.keywords || []) : [];
    const totalKeywords = allKeywords.length;

    //console.log('확인 reflectionData', reflectionData?.reflection1 ?? false);       
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
                    알고리즘 핵심 키워드: {history.images.map(image => `#${image.main_keyword}`).join(", ")}
                </div>
            </div>
            <div className="flex flex-row justify-end gap-2 p-4 ">
                <div className="relative group">
                    <button className="bg-black text-white rounded-full px-6 py-3 text-md font-bold shadow transition hover:bg-gray-900"
                    onClick={async () => {
                        setOpen(true);
                        // initializeReflectionData는 비동기 함수이므로 await 사용
                        await initializeReflectionData();
                    }}
                    >
                        알고리즘 시각화 분석 과정 살펴보기  
                    </button>
                    <div className="absolute right-full mr-4 top-[22px] -translate-y-1/2 bg-gray-100 text-black px-6 py-3 rounded-2xl shadow-lg text-base 
                        font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 
                        after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-gray-100 after:border-r-transparent after:ml-[-1px]
                        animate-bounce-slow">
                        알고리즘이 나를 바라본 과정을 세부적으로 다 확인할 수 있어요.
                    </div>
                </div>
                {/*
                {latest && ( !isDisabled ? (
                    
                    <div className="relative group">
                    <button className="bg-blue-600 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700"
                        onClick={() => {
                            router.push('/reflection/reflection1');         
                        }}
                    >
                        <Sparkles className="w-5 h-5" />
                        알고리즘 시각화 감상 기록하기
                    </button>
                    <div className="absolute right-full mr-4 bottom-[1px] -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-xl shadow-top-2xl text-base 
                            font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 
                            after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]
                            animate-bounce-slow">
                            업데이트 전, 알고리즘 탐색에 대한 여정의 감상을 남겨보세요.
                        </div>
                    </div>
                    */}
                {/* }):( */}
                    
                    <div className="relative group">
                        {/*

                        <button className="bg-blue-400 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700"
                                onClick={() => {
                                    router.push('/reflection/reflection1');         
                                }}
                            >
                                <Sparkles className="w-5 h-5" />
                                알고리즘 시각화 감상 다시 남기기
                        </button>
                        <div className="absolute right-full mr-4 bottom-[1px] -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base 
                            font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 
                            after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]
                            animate-bounce-slow">
                            감상을 다시 남길 수 있어요.
                        </div>
                         */} 
                    </div>
                    
                {/* }))}  */}
               
            </div>
            <AnalysisModal open={open} onClose={() => setOpen(false)} history={history} /> 
        </div>
    );
}