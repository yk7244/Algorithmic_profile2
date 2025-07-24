import { MousePointerClickIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface DragNoticeProps {
    isEditing: boolean;
    showDragNotice: boolean;
    isSearchMode: boolean;
}

const DragNotice = ({ isEditing, showDragNotice, isSearchMode }: DragNoticeProps) => {
    const [show, setShow] = useState(true);
    useEffect(() => {
        if (isEditing) {
            setShow(true);
        }
    }, [isEditing]);

    if (!show) return null;

    return (
        <>
        {showDragNotice && !isSearchMode && (
        <div
        className={`z-1 mt-[100px] bg-white/80 backdrop-blur-lg text-black px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn z-50`}
        role="alert"
        aria-live="polite"
        >
        
            <>  
            {isEditing ? (
                <>
                <div className="flex flex-row items-center gap-2">
                    <img src="/images/dragicon.png" alt="click" className="w-6 h-6" />
                    <span className="text-base">이미지를 드래그해서 위치를 바꿔보세요!</span>
                </div> 
                <button
                    className="ml-2 text-black font-bold text-lg hover:text-blue-200 transition"
                    onClick={() => setShow(false)}
                    aria-label="드래그 안내 닫기"
                    type="button"
                    >
                        ×
                </button>
            </>
            ):(
                <>
                <div className="flex flex-row items-center gap-2">
                    <MousePointerClickIcon className="w-6 h-6 text-black" />
                    <span className="text-base">이미지를 클릭해 알고리즘 설명을 확인해보세요!</span>
                </div> 
                <button
                    className="ml-2 text-black font-bold text-lg hover:text-blue-200 transition"
                    onClick={() => setShow(false)}
                    aria-label="드래그 안내 닫기"
                    type="button"
                    >
                        ×
                </button>
                </>
            )}
            
            </>
        </div>
        )}
        </>
    );
};

export default DragNotice;