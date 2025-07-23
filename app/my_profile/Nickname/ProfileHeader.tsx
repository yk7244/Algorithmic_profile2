import React, { useEffect, useMemo } from "react";
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
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    isEditing,
    isGeneratingProfile,
    onEditClick,
    onSaveClick,
    onGenerateProfile,
    isOwner = true,
    changeProfile,
    }) => {
    const displayProfile = useMemo(() => getLatestProfileData(), []);
    
    //console.log('🔥 fallbackProfile:', displayProfile);
    //const displayProfile = profile || fallbackProfile;
    useEffect(() => {
        console.log('컴포넌트 profile:', profile);
    }, [profile]);

    return (
        <div className="relative group pl-8 max-w-[320px] space-y-6 pt-[40px]">
            {/* 호버 툴팁 */}
            
            {/* 닉네임 */}
            <div className="group text-white text-sm font-bold bg-black/60 w-fit px-4 py-1 rounded-full backdrop-blur-sm relative">
                알고리즘이 본 당신은...
                
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">
                    {profile?.nickname ? profile.nickname : 'My 알고리즘 자화상'}
                    <div
                        className="justify-center absolute left-full mr-50 top-1/2 -translate-y-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg text-base font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-y-transparent after:border-r-white after:border-l-transparent after:mr-[-1px]"
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
            
            
            {/* 별명 생성 버튼 (isOwner가 true일 때만 렌더링) 
            {isOwner && (
                <div className="mt-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 flex gap-2 bg-transparent hover:bg-transparent pl-0"
                    onClick={() => {
                        //console.log('🔥 ProfileHeader에서 버튼이 클릭되었습니다!');
                        onGenerateProfile();
                    }}
                    disabled={isGeneratingProfile}
                >
                    {isGeneratingProfile ? (
                    <>
                        <div className="animate-spin mr-2"></div>
                        당신만의 별명을 생성 중입니다...
                    </>
                    ) : (
                    <>
                        <RefreshCw className="" />
                        별명 생성하기
                    </>
                    )}
                </Button>
                </div>
            )}
                */}
        </div>
    );
};

export default ProfileHeader; 