import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Save, RefreshCw, Link } from "lucide-react";

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
    isEditing,
    isGeneratingProfile,
    onEditClick,
    onSaveClick,
    onGenerateProfile,
    }) => (
    <div className="absolute z-30 pl-8 max-w-[600px] space-y-6 pt-[140px]">
        {/* 닉네임 */}
        <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">
            {profile.nickname ? `${profile.nickname}의 무드보드` : 'My 무드보드'}
        </h1>
        </div>
        {/* 닉네임 설명 */}
        <div className="text-gray-500 text-base leading-relaxed mt-2">
        {profile.description || '나만의 알고리즘 프로필을 생성해보세요.'}
        </div>
        {/* 저장/편집과 별명생성 버튼 */}
        <div className="flex gap-4">
        {/* 저장/편집 버튼 */}
        <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
            onClick={isEditing ? onSaveClick : onEditClick}
        >
            {isEditing ? (
            <>
                <Save className="h-4 w-4" />
                저장
            </>
            ) : (
            <>
                <Edit2 className="h-4 w-4" />
                편집
            </>
            )}
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-base font-medium hover:text-primary">
            <Link href="/update">업데이트</Link>
        </Button>
        {/* 별명 생성 버튼 */}
        <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 bg-purple-500 text-white hover:bg-purple-600 flex items-center gap-2"
            onClick={onGenerateProfile}
            disabled={isGeneratingProfile}
        >
            {isGeneratingProfile ? (
            <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                생성 중...
            </>
            ) : (
            <>
                <RefreshCw className="h-4 w-4" />
                별명 생성하기
            </>
            )}
        </Button>
        </div>
    </div>
);

export default ProfileHeader; 