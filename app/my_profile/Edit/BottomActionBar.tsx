import React from "react";
import { Button } from "@/components/ui/button";
import { Pen, Save, RefreshCw } from "lucide-react";
import Link from "next/link";

interface BottomActionBarProps {
    isEditing: boolean;
    isGeneratingProfile: boolean;
    onEditClick: () => void;
    onSaveClick: () => void;
    onGenerateProfile: () => void;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
    isEditing,
    isGeneratingProfile,
    onEditClick,
    onSaveClick,
}) => (
    <div className="fixed bottom-20 left-20 flex flex-col gap-3 z-50">
        {/* 수정하기/저장 버튼 */}
        <Button
            variant="outline"
            size="lg"
            className={`h-12 px-8 border border-gray-200 flex items-center gap-2 rounded-full shadow-md
                ${isEditing ? 'bg-black text-white hover:text-gray-200 hover:bg-gray-600' : 'bg-white text-black hover:bg-black hover:text-white'}
            `}
            onClick={isEditing ? onSaveClick : onEditClick}
        >
            {isEditing ? (
                <>
                    <Save className="h-4 w-4" />
                    저장하기
                </>
            ) : (
                <>
                    <Pen className="h-4 w-4" />
                    수정하기
                </>
            )}
        </Button>
        {/* 업로드 버튼 */}
        <Link href="/upload/page_user">
            <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 bg-white text-black border border-gray-200 hover:bg-black hover:text-white flex items-center gap-2 rounded-full shadow-md"
            >
                <RefreshCw className="h-4 w-4" />
                업로드하기
            </Button>
        </Link>
    </div>
);

export default BottomActionBar; 