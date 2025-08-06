import React, { useState, useEffect } from "react";
import { ClusterHistory } from "@/app/types/profile";
import { getReflectionData } from "@/app/utils/get/getReflectionData";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import { Link, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

// ClusterHistory 카드 컴포넌트
export const UpdateCard: React.FC<{ history: ClusterHistory }> = ({ history }) => {
    const router = useRouter();
    const [reflectionData, setReflectionData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    //console.log('history', history);
    // 최신 기록 날짜 구하기
    const latestEntry = history;
    const latestEntryDate = latestEntry.created_at ? new Date(new Date(latestEntry.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : '';

    const [updateDate, setUpdateDate] = useState<number>(-3); // 기본값: 로딩 중

    // 업데이트 날짜 로드
    useEffect(() => {
        const loadUpdateDate = async () => {
            try {
                const result = await isOneWeekPassed();
                setUpdateDate(result);
                console.log('🔍 UpdateCard Upload Check 결과:', result);
            } catch (error) {
                console.error('❌ UpdateCard Upload Check 오류:', error);
                setUpdateDate(-1); // 오류 시 초기 유저로 처리
            }
        };

        loadUpdateDate();
    }, []);

    // 리플렉션 데이터 로드
    useEffect(() => {
        const loadReflectionData = async () => {
            try {
                setIsLoading(true);
                const data = await getReflectionData();
                setReflectionData(data);
                console.log('✅ UpdateCard: 리플렉션 데이터 로드 완료');
            } catch (error) {
                console.error('❌ UpdateCard: 리플렉션 데이터 로드 오류:', error);
                setReflectionData(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadReflectionData();
    }, []);

    // 로딩 중일 때
    if (isLoading) {
        return (
            <div className="bg-[#E1E8FC] rounded-2xl shadow p-6 w-full">
                <div className="animate-pulse">
                    <div className="h-4 bg-white rounded w-32 mb-4"></div>
                    <div className="h-6 bg-white rounded w-48 mb-4"></div>
                </div>
            </div>
        );
    }

    //console.log('reflectionData', reflectionData);
    
    return (
    <div className="bg-[#E1E8FC] rounded-2xl shadow p-6 w-full">
        <div className="bg-white rounded-full px-4 py-1 w-fit text-xs text-gray-500 mb-4 font-bold">
        업데이트 날짜: {latestEntryDate} 
        </div>

        {updateDate !== 2 ? (   
        <div className="flex flex-row justify-between items-center"> 
            <div className="flex flex-col pl-2  text-md">
                <div className="text-black mb-7 font-bold">새로운 알고리즘 자화상 업데이트가 가능해요</div>
            </div>
            {reflectionData?.reflection2 === false ? (
                <div className="relative group">
                    {/*
                    <button className="items-right bg-blue-600 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700"
                    onClick={() => {
                        router.push('/reflection/reflection2');         
                    }}
                    >
                        <Sparkles className="w-5 h-5" />
                        알고리즘 탐색 감상 남기기
                    </button>
                    <div className="absolute right-full mr-4 bottom-[1px] -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base 
                    font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 
                    after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]
                    animate-bounce-slow">
                    탐색하기 전, 알고리즘 자화상 감상을 남겨보세요.
                    </div>
                     */}    
                </div>
            ):(
                <>
                {/*
                <div className="relative group">
                    <button className="items-right bg-blue-400 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700"
                    onClick={() => {
                        router.push('/reflection/reflection2');         
                    }}
                    >
                        <Sparkles className="w-5 h-5" />
                        알고리즘 탐색 감상 다시 남기기
                    </button>
                    <div className="absolute right-full mr-4 bottom-[1px] -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base 
                        font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 
                        after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]
                        animate-bounce-slow">
                        감상을 다시 남길 수 있어요.
                    </div>
                </div>
                */}
                {/* 업로드 버튼 
                <div className="relative group">
                        <button
                        className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md transition-all"
                        onClick={() => {
                            router.push('/');         
                        }}
                        >
                        <RefreshCw className="w-5 h-5 text-black" />
                        </button>
                    
                    <div className="absolute right-full mr-4 bottom-[1px] -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base 
                    font-medium whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:left-full after:top-1/2 
                    after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-l-white after:border-r-transparent after:ml-[-1px]
                    animate-bounce-slow">
                    새로운 알고리즘 분석을 원하시나요? 시청기록을 업로드해 업데이트해보세요
                    </div>
                </div>
                */}
                </>
            )}
        </div>
            
            
        ) : (
            <div className="flex flex-col pl-2">
                <div className="text-black mb-7 font-bold">다음 알고리즘 자화상 업데이트는 위 날짜에 예정되어 있어요</div>
            </div>
        )}
    </div>
);
}