import { ClusterHistory } from "@/app/types/profile";
import { isOneWeekPassed } from "@/app/utils/uploadCheck";
import { Sparkles } from "lucide-react";

// ClusterHistory 카드 컴포넌트
export const UpdateCard: React.FC<{ history: ClusterHistory }> = ({ history }) => {
    
    console.log('history', history);
    // 최신 기록 날짜 구하기
    const latestEntry = history;
    const latestEntryDate = latestEntry.created_at ? new Date(new Date(latestEntry.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : '';

    const updateDate = isOneWeekPassed();
    
    return (
    <div className="bg-[#E1E8FC] rounded-2xl shadow p-6 w-full">
        <div className="bg-white rounded-full px-4 py-1 w-fit text-xs text-gray-500 mb-4 font-bold">
        업데이트 날짜: {latestEntryDate} 
        </div>

        {updateDate == 2 ? (   
        <div className="flex flex-row justify-between items-center"> 
            <div className="flex flex-col pl-2  text-md">
                <div className="text-black mb-7 font-bold">새로운 알고리즘 프로필 업데이트가 가능해요</div>
            </div>

            <button className="items-right bg-blue-600 text-white rounded-full px-6 py-3 text-md font-bold shadow flex items-center gap-2 transition hover:bg-blue-700">
                <Sparkles className="w-5 h-5" />
                알고리즘 탐색 리플랙션 하기
            </button>
        </div>
            
            
        ) : (
            <div className="flex flex-col pl-2">
                <div className="text-black mb-7 font-bold">다음 알고리즘 프로필 업데이트는 위 날짜에 예정되어 있어요</div>
            </div>
        )}
    </div>
);
}