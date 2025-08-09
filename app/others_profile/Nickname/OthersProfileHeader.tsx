import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";
import { getLatestProfileData } from '@/app/utils/get/getProfileData'; 

interface ProfileHeaderProps {
    profile: { nickname: string; description: string };
    isEditing: boolean;
    isGeneratingProfile: boolean;
    onEditClick: () => void;
    onSaveClick: () => void;
    onGenerateProfile: () => void;
    isOwner?: boolean;
    changeProfile: (nickname: string, description: string) => void;
    isSearchMode: boolean;
    searchKeyword: string;
    similarities: number[];
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    searchKeyword,
    similarities,
    }) => {
    const [displayProfile, setDisplayProfile] = useState<any>(null);
    const [showTaskGuide, setShowTaskGuide] = useState(false);

    // 프로필 데이터를 비동기로 로드
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profileData = await getLatestProfileData();
                setDisplayProfile(profileData);
            } catch (error) {
                console.error('프로필 로드 중 오류:', error);
            }
        };
        loadProfile();
    }, []);
    useEffect(() => {
        if (showTaskGuide) {
            const timer = setTimeout(() => setShowTaskGuide(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showTaskGuide]);
    //console.log('🔥 fallbackProfile:', displayProfile);
    //const displayProfile = profile || fallbackProfile;
    

    return (
        <div className="flex flex-row justify-between h-full">
            
            <div className={`relative flex flex-col group pl-8 pt-[40px] mb-20 shadow-2xl 
                px-10 py-12 z-10 justify-center h-full bg-white/20 backdrop-blur-lg`} >
                {/* 호버 툴팁 */}
                
                {/* 닉네임 */}
                <div className="text-sm font-bold flex flex-row items-center">
                    <div className="group text-white font-bold bg-black/80 backdrop-blur-lg px-2 rounded-full text-[12px] mr-1">
                        #{searchKeyword}     
                    </div>
                    <span className="text-sm font-bold"> 과 비슷한 키워드를 가진 </span>                
                </div>
                <div className="text-sm font-bold flex flex-row items-center">다른 사람의 알고리즘 시각화는..</div>

                <div className="flex items-center justify-between mt-12">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {profile?.nickname ? profile.nickname : 'My 알고리즘 시각화'}
                        <div
                            className="justify-center absolute left-80 ml-4 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-r-white after:border-l-transparent after:mr-[-1px]"
                            style={{ zIndex: 9999 }}
                        >
                            {profile?.nickname ? profile.nickname : 'My 알고리즘 시각화'}님의 시청 성향을 종합적으로 분석해 <br/> 재밌는 캐릭터로 표현해봤어요.
                        </div>
                    </h1>
                </div>
                {/* 닉네임 설명 */}
                <div className="text-gray-700 text-sm leading-relaxed mt-2">
                {displayProfile?.description.replace(/당신/g, `${profile?.nickname}님`) || '설명을 찾는데 실패했어요.'}

                </div>

                {/* 유사도 */}
                <div className="w-fit py-1 font-bold items-center mt-6 text-sm text-black/40 bg-black/20 backdrop-blur-lg px-2 rounded-full">  
                    이 사람과의 전체 유사도 <span className="text-sm ml-1 mr-1 text-blue-600"> {Math.round(similarities[0]*100)}%</span>
                </div>
            </div>
            
        </div>
    );
};

export default ProfileHeader; 