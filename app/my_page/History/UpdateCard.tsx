import { ClusterHistory } from "@/app/types/profile";
import { getReflectionData } from "@/app/utils/get/getReflectionData";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import { Link, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

// ClusterHistory 카드 컴포넌트
export const UpdateCard: React.FC<{ history: ClusterHistory }> = ({ history }) => {
    const router = useRouter();
    //console.log('history', history);
    // 최신 기록 날짜 구하기
    const latestEntry = history;
    const latestEntryDate = latestEntry.created_at ? new Date(new Date(latestEntry.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : '';

    const updateDate = isOneWeekPassed();
    const reflectionData = getReflectionData();
    //console.log('reflectionData', reflectionData);
    
    return (
    <div className="bg-[#E1E8FC] rounded-2xl shadow p-6 w-full">
        <div className="bg-white rounded-full px-4 py-1 w-fit text-xs text-gray-500 mb-4 font-bold">
        업데이트 날짜: {latestEntryDate} 
        </div>

        {updateDate !== 2 ? (   
        <div className="flex flex-row justify-between items-center"> 
            <div className="flex flex-col pl-2  text-md">
                <div className="text-black mb-7 font-bold">새로운 알고리즘 프로필 업데이트가 가능해요</div>
            </div>
            {reflectionData?.reflection2 === false ? (
                <button className="items-right bg-blue-600 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700"
                onClick={() => {
                    router.push('/reflection/reflection2');         
                }}
                >
                    <Sparkles className="w-5 h-5" />
                    알고리즘 탐색 감상 남기기
                </button>
            ):(
                <>
                

                {/* 업로드 버튼 */}
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
                </>
            )}
        </div>
            
            
        ) : (
            <div className="flex flex-col pl-2">
                <div className="text-black mb-7 font-bold">다음 알고리즘 프로필 업데이트는 위 날짜에 예정되어 있어요</div>
            </div>
        )}
    </div>
);
}