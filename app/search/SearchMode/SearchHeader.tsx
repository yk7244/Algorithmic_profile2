import { Button } from "@/components/ui/button";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchHeaderProps {
    onBack: () => void;
}

const SearchHeader = ({ onBack }: SearchHeaderProps) => {
    const router = useRouter();

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/'); // 홈 또는 원하는 경로
        }
    };

    return (
        <div className="absolute z-30 pl-8 max-w-[320px] space-y-6 pt-[40px] 
        transform transition-transform duration-1000 ease-in-out">
            {/* 닉네임 */}
            <div className="flex flex-row items-center">
                <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-white/10"
                >
                <ArrowLeft className="h-2 w-2" />
                
                </Button>
                <div className="text-black text-md font-bold bg-gradient-to-r 
                from-white via-[#3B71FE] to-white bg-[length:200%_100%] 
                bg-clip-text text-transparent animate-gradient-move 
                transform transition-transform duration-1000 ease-in-out">
                    탐색모드로 전환되었어요...
                </div>
            </div>

            <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white
            transform transition-transform duration-1000 ease-in-out">
            당신의 관심사로 <br/>
            다른 알고리즘 프로필을 <br/>
            탐색해보세요.
            </h1>
            </div>
            {/* 닉네임 설명 */}
            <div className="text-white text-sm leading-relaxed mt-2
            transform transition-transform duration-1000 ease-in-out
            ">
            궁금한 키워드를 선택하면 당신과 유사한 알고리즘 프로필을 확인할 수 있어요.
            </div>
            
            
            
        </div>
    );
};

export default SearchHeader; 