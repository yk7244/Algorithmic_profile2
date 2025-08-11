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
        <div className="
            tive flex flex-col group pl-8 space-y-6 pt-[40px] mb-20 shadow-2xl 
                px-10 py-12 z-10 justify-center h-full
                bg-black/40 backdrop-blur-sm ">
            <Button
                variant="ghost"
                size="icon"
                onClick={()=>{
                    router.push('/my_profile');
                }}
                className=" top-0 left-0 text-white hover:bg-white/10"
                >
                <ArrowLeft className="h-2 w-2" />

            </Button>
            {/* 닉네임 */}

            <div className="flex flex-row items-center ">
                
                <div className="text-white text-sm font-bold bg-blue-600 w-fit px-4 py-1 rounded-full backdrop-blur-sm">
                탐색모드로 전환되었어요...
                </div>
            </div>

            <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white
            transform transition-transform duration-1000 ease-in-out">
            당신과 비슷한 다른 사람들의  <br/>
            알고리즘 키워드를  <br/>
            탐색해보세요.
            </h1>
            </div>
            {/* 닉네임 설명 */}
            <div className="text-white text-sm leading-relaxed mt-2
            transform transition-transform duration-1000 ease-in-out pb-14
            ">
            궁금한 키워드를 선택하면 당신과 유사한 알고리즘 시각화를 확인할 수 있어요.
            </div>
            
            
            
        </div>
    );
};

export default SearchHeader; 