import React from "react";
import { Button } from "@/components/ui/button";
import { Pen, Save, RefreshCw } from "lucide-react";

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
            className="h-12 px-8 bg-white text-black border border-gray-200 hover:bg-gray-50 flex items-center gap-2 rounded-full shadow-md"
            onClick={isEditing ? onSaveClick : onEditClick}
        >
            {isEditing ? (
                <div className="bg-black text-white">
                    <Save className="h-4 w-4" />
                    저장하기
                </div>
            ) : (
                <>
                    <Pen className="h-4 w-4" />
                    수정하기
                </>
            )}
        </Button>

        {/* 업데이트 버튼 */}
        <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 bg-white text-black border border-gray-200 hover:bg-gray-50 flex items-center gap-2 rounded-full shadow-md"
        >
            <RefreshCw className="h-4 w-4" />
            업데이트
        </Button>
    </div>
);

export default BottomActionBar; 