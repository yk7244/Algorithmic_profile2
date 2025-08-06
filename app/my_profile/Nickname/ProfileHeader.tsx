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
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    isSearchMode,
    }) => {
    // props로 받은 profile 사용 (이미 main_description -> description 매핑됨)
    const displayProfile = profile;
    const [showTaskGuide, setShowTaskGuide] = useState(false);
    useEffect(() => {
        if (showTaskGuide) {
            const timer = setTimeout(() => setShowTaskGuide(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showTaskGuide]);
    //console.log('🔥 fallbackProfile:', displayProfile);
    //const displayProfile = profile || fallbackProfile;
    useEffect(() => {
        console.log('컴포넌트 profile:', profile);
    }, [profile]);

    return (
        <div className="flex flex-row justify-between h-full">
            
            <div className={`relative flex flex-col group pl-8 space-y-6 pt-[40px] mb-20 shadow-2xl 
                px-10 py-12 z-10 justify-center h-full
                ${isSearchMode ? 'bg-blue-600/80' : 'bg-white/70'} backdrop-blur-lg`} style={{height: '100vh', width: '70vw' }}>
                {/* 호버 툴팁 */}
                
                
                {/* 닉네임 */}
                <div className="group text-white text-sm font-bold bg-black/60 w-fit px-4 py-1 rounded-full backdrop-blur-sm relative">
                    알고리즘이 본 당신은...
                    
                </div>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {profile?.nickname ? profile.nickname : 'My 알고리즘 자화상'}
                        <div
                            className="justify-center absolute left-80 ml-4 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-r-white after:border-l-transparent after:mr-[-1px]"
                            style={{ zIndex: 9999 }}
                        >
                            당신의 시청 성향을 종합적으로 분석해 <br/> 재밌는 동물로 표현해봤어요.
                        </div>
                    </h1>
                </div>
                {/* 닉네임 설명 */}
                <div className="text-gray-700 text-sm leading-relaxed mt-2">
                {displayProfile?.description || '나만의 알고리즘 자화상을 생성해보세요.'}
                </div>
            </div>
            
        </div>
    );
};

export default ProfileHeader; 