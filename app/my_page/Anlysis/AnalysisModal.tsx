import React, { useEffect, useState } from "react";
import { ClusterHistory, WatchHistory } from "@/app/types/profile";
import { getWatchHistory } from "@/app/utils/get/getWatchHistory";

interface AnalysisModalProps {
    open: boolean;
    onClose: () => void;
    history: ClusterHistory;
}

const steps = [
  {
    title: "시청기록 키워드 추출",
    desc: "시청한 영상에서 키워드를 뽑아냈어요.",
  },
  {
    title: "키워드 그룹화",
    desc: "비슷한 키워드끼리 묶어 정리했어요.",
  },
  {
    title: "키워드 그룹을 대표하는 표현 생성",
    desc: "묶음을 관통하는 감정이나 상황을 표현했어요.",
  },
  {
    title: "그룹 이미지화",
    desc: "묶음을 잘 표현해주는 이미지로 나타냈어요.",
  },
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ open, onClose, history }) => {
    const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    useEffect(() => {
        setWatchHistory(getWatchHistory() as WatchHistory[]);
    }, []);

    const date = watchHistory[0]?.timestamp?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const totalVideos = watchHistory.length;
    const allKeywords = watchHistory.flatMap((v) => v.keywords || []);
    const totalKeywords = allKeywords.length;

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="absolute top-6 mt-[12px] left-[120px] bg-[#F5F5F5] text-black rounded-full px-4 py-2 text-sm font-bold">{date}</div>
            <div className="bg-white rounded-3xl shadow-xl mt-[55px] ml-[120px] mr-[120px] h-[650px] relative flex overflow-hidden" onClick={e => e.stopPropagation()}>
                <button
                    className="absolute top-6 right-10 text-gray-400 hover:text-black text-2xl z-10"
                    onClick={onClose}
                    aria-label="닫기"
                >
                    ×
                </button>
                {/* 왼쪽 탭 타임라인 */}
                <div className="w-[420px] bg-white flex flex-col items-center px-0 relative h-full">
                    <div className="flex flex-col gap-0 w-full relative h-full justify-center items-center ">
                        {/* 세로선 */}
                        <div className="absolute left-[70px] w-[2px] bg-gray-200 z-0" style={{height: 'calc(100% - 300px)'}} />
                            {steps.map((step, idx) => (
                                <button
                                    key={step.title}
                                    className={`ml-10 mr-10 p-2 rounded-2xl justfy-centerflex items-start gap-4 relative z-10 mb-2 w-[380px] text-left focus:outline-none ${activeStep === idx ? 'bg-black' : ''}`}
                                    onClick={() => setActiveStep(idx)}
                                    tabIndex={0}
                                    type="button"
                                >
                                    <div className="ml-6 flex flex-row justify-center items-center">
                                        <div className="flex flex-col items-center">
                                            <div className={`rounded-full flex items-center justify-center font-bold text-xl border-4 border-black shadow ${activeStep === idx ? 'bg-white text-black w-11 h-11 ' : 'bg-black text-white w-10 h-10 '}`}>
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="pt-1 flex-1">
                                            <div className="rounded-xl px-4 py-2">
                                                <div className={`font-bold text-lg text-black ${activeStep === idx ? 'text-white' : ''}`}>{step.title}</div>
                                                <div className={`text-gray-500 text-sm mt-1 ${activeStep === idx ? 'text-gray-300' : ''}`}>{step.desc}</div>
                                            </div>
                                            
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                </div>
                <div className="w-[700px] h-full ml-10 flex flex-col p-14 bg-[#F7F7F8] overflow-y-auto">
                    {activeStep === 0 && (
                        // 1단계: 기존 시청기록/키워드 리스트
                        <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-8">
                                <div className="text-gray-700 text-md">총 분석 영상 수: <span className="font-bold text-lg">{totalVideos}</span></div>
                                <div className="text-gray-700 text-md">총 키워드 수: <span className="font-bold text-lg">{totalKeywords}</span></div>
                            </div>
                            <div className="text-blue-600 text-sm cursor-pointer hover:underline select-none">
                                키워드 추출 기준이 궁금해요 ?
                            </div>
                        </div>
                        <div className="flex flex-col w-full overflow-y-auto mt-10">
                            {watchHistory.map((video, idx) => (
                                <div key={video.videoId + idx} className="mb-7">
                                    <div className="font-bold text-lg text-black mb-2 max-w-[80%] truncate">{video.title}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {(video.keywords || []).map((kw, i) => (
                                            <span key={kw + i} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-semibold">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                    {activeStep === 1 && (
                        // 2단계: 키워드 그룹화 결과 or 설명
                        <>
                        </>
                    )}
                    {activeStep === 2 && (
                        // 3단계: 대표 표현 생성 결과 or 설명
                        <>
                        </>
                    )}
                    {activeStep === 3 && (
                        // 4단계: 그룹 이미지화 결과 or 설명
                        <>
                        </>
                    )}
                </div>
                
            </div>
        </div>
    );
}; 