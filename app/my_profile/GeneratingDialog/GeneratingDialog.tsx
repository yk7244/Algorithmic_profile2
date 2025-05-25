import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GeneratingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatingStep: number;
}

const generatingSteps = [
  "당신의 시청 기록을 분석하고 있습니다...",
  "알고리즘이 당신의 취향을 이해하고 있습니다...",
  "흥미로운 패턴을 발견했습니다!",
  "당신만의 특별한 별명을 생성중입니다..."
];

const GeneratingDialog: React.FC<GeneratingDialogProps> = ({
  open,
  onOpenChange,
  generatingStep,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px] bg-black/95 border-none text-white">
      <DialogHeader>
        <DialogTitle className="text-white text-center">알고리즘 프로필 생성</DialogTitle>
      </DialogHeader>
      <div className="py-10 px-4">
        <div className="flex flex-col items-center space-y-6">
          {/* 로딩 애니메이션 */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin-slow"></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-pink-500 animate-spin-slower"></div>
          </div>
          {/* 현재 단계 메시지 */}
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold animate-pulse">
              {generatingSteps[generatingStep]}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {generatingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === generatingStep ? 'bg-blue-500 scale-125' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default GeneratingDialog; 