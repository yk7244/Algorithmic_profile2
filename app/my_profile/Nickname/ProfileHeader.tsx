import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";

interface ProfileHeaderProps {
    profile: { nickname: string; description: string };
    isEditing: boolean;
    isGeneratingProfile: boolean;
    onEditClick: () => void;
    onSaveClick: () => void;
    onGenerateProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    isGeneratingProfile,
    onGenerateProfile,
    }) => (
    <div className="absolute z-30 pl-8 max-w-[600px] space-y-6 pt-[40px]">
        {/* 닉네임 */}
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
            {profile.nickname ? `${profile.nickname}의 무드보드` : 'My 무드보드'}
        </h1>
        </div>
        {/* 닉네임 설명 */}
        <div className="text-gray-700 text-sm leading-relaxed mt-2">
        {profile.description || '나만의 알고리즘 프로필을 생성해보세요.'}
        </div>
        
        {/* 별명 생성 버튼 */}
        <div className="mt-4">
        <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 flex gap-2 bg-transparent hover:bg-transparent pl-0"
            onClick={onGenerateProfile}
            disabled={isGeneratingProfile}
        >
            {isGeneratingProfile ? (
            <>
                <div className="animate-spin mr-2"></div>
                생성 중...
            </>
            ) : (
            <>
                <RefreshCw className="" />
                별명 생성하기
            </>
            )}
        </Button>
        </div>
    </div>
);

export default ProfileHeader; 