"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PageUser from '../page_user/page';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';

interface DialogAnimationProps {
open: boolean;
onOpenChange: (open: boolean) => void;
currentStep: number;
totalSteps: number;
stepDescription: string;
}

const steps = [
{ id: 1, title: "키워드 추출", description: "당신의 관심이 드러나고 있어요..." },
{ id: 2, title: "클러스터 분석", description: "연결고리를 찾고 있어요... 곧 의미가 드러납니다." },
{ id: 3, title: "이미지 생성", description: "당신의 시청 경험을 한 장면으로 표현 중입니다." },
{ id: 4, title: "분석 완료", description: "이제, 당신의 시청 자아를 만나볼 차례입니다." }
];

// 간단한 Progress 컴포넌트
const Progress = ({ value, className }: { value: number; className?: string }) => (
<div className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div
    className="h-full bg-blue-500 transition-all duration-300 ease-out"
    style={{ width: `${value}%` }}
    />
</div>
);

export default function DialogAnimation({ 
open, 
onOpenChange, 
currentStep, 
totalSteps, 
stepDescription 
}: DialogAnimationProps) {
const [progress, setProgress] = useState(0);
const [showPageUser, setShowPageUser] = useState(false);
const [fadeKey, setFadeKey] = useState(0);

useEffect(() => {
    if (open) {
    const progressInterval = setInterval(() => {
        setProgress(prev => {
        const targetProgress = (currentStep / totalSteps) * 100;
        if (prev < targetProgress) {
            return Math.min(prev + 2, targetProgress);
        }
        return prev;
        });
    }, 100);

    return () => clearInterval(progressInterval);
    }
}, [open, currentStep, totalSteps]);

useEffect(() => {
    setFadeKey(prev => prev + 1);
}, [currentStep]);

const handleComplete = () => {
    setShowPageUser(true);
};

if (showPageUser) {
    return <PageUser />;
}

return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
        <DialogTitle className="text-center text-xl font-bold">
            영상 분석 진행 중
        </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-6">
        {/* Progress Bar */}
        <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
            <span>진행률</span>
            <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full h-3" />
        </div>

        {/* Current Step Animation */}
        <div className="text-center space-y-4">
            <div
            key={fadeKey}
            className="space-y-3 animate-fade-in"
            >
            <div className="flex items-center justify-center space-x-2">
                {currentStep < totalSteps ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                ) : (
                <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                <span className="text-lg font-semibold">
                {steps[currentStep - 1]?.title || '진행 중...'}
                </span>
            </div>
            <p className="text-gray-600 text-sm">
                {stepDescription || steps[currentStep - 1]?.description}
            </p>
            </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-center space-x-2">
            {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
                <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                    index + 1 <= currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                >
                {index + 1 < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                ) : (
                    index + 1
                )}
                </div>
                {index < steps.length - 1 && (
                <ArrowRight className={`h-4 w-4 mx-2 ${
                    index + 1 < currentStep ? 'text-blue-500' : 'text-gray-300'
                }`} />
                )}
            </div>
            ))}
        </div>

        {/* Animation Elements */}
        <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>

        {/* Complete Button */}
        {currentStep >= totalSteps && (
            <div className="text-center animate-fade-in-delay">
            <Button 
                onClick={handleComplete}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
                결과 보기
            </Button>
            </div>
        )}
        </div>

        <style jsx>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
            animation: fade-in 0.5s ease-out;
        }
        
        .animate-fade-in-delay {
            animation: fade-in-delay 0.5s ease-out 0.5s both;
        }
        `}</style>
    </DialogContent>
    </Dialog>
);
} 